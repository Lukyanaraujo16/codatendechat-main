import React, { useState, useEffect, useContext, useMemo } from "react";
import { useLocation, useHistory, Link as RouterLink } from "react-router-dom";
import MainContainer from "../../components/MainContainer";
import {
  Box,
  Button,
  makeStyles,
  Paper,
  Tabs,
  Tab,
  Typography,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import PermMediaIcon from "@material-ui/icons/PermMedia";
import InfoOutlined from "@material-ui/icons/InfoOutlined";
import { AppPageHeader, AppSectionCard } from "../../ui";

import TabPanel from "../../components/TabPanel";

import SchedulesForm from "../../components/SchedulesForm";
import Options from "../../components/Settings/Options";

import { i18n } from "../../translate/i18n.js";
import { toast } from "react-toastify";

import useCompanies from "../../hooks/useCompanies";
import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";

import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import CompanyTimezoneSettings from "../../components/CompanyTimezoneSettings";
import CompanyCrmVisibilitySettings from "../../components/CompanyCrmVisibilitySettings";
import PushNotificationPreferences from "../../components/PushNotificationPreferences";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const PLATFORM_QUICK_LINKS = [
  { to: "/saas/companies", labelKey: "platform.tabs.companies" },
  { to: "/saas/plans", labelKey: "platform.tabs.plans" },
  { to: "/saas/helps", labelKey: "platform.tabs.helps" },
  { to: "/saas/announcements", labelKey: "platform.tabs.announcements" },
];

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.up("md")]: {
      gap: theme.spacing(3),
    },
  },
  mainPaper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    flex: 1,
  },
  tab: {
    backgroundColor: theme.palette.options,
    borderRadius: 4,
  },
  paper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  container: {
    width: "100%",
    maxHeight: "100%",
  },
  pageContextWrap: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    width: "100%",
  },
  superLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
  superCardTitle: {
    fontWeight: 600,
    fontSize: "1rem",
    marginBottom: theme.spacing(0.5),
  },
  mediaManagerCard: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "flex-start",
  },
  mediaManagerIconWrap: {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.action.hover,
  },
  mediaManagerIcon: {
    fontSize: 28,
  },
  pageSectionsStack: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    width: "100%",
    boxSizing: "border-box",
  },
  sectionPaper: {
    padding: theme.spacing(3),
    width: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: {
    fontWeight: 600,
  },
  sectionCardHeaderRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

const SettingsCustom = () => {
  const classes = useStyles();
  const location = useLocation();
  const history = useHistory();
  const [tab, setTab] = useState("notifications");
  const [schedules, setSchedules] = useState([]);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [settings, setSettings] = useState({});
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const [chatbotControl, setChatbotControl] = useState(null);
  const [chatbotControlLoading, setChatbotControlLoading] = useState(false);
  const [chatbotControlSaving, setChatbotControlSaving] = useState(false);
  const [chatbotWeekdayStart, setChatbotWeekdayStart] = useState("08:00");
  const [chatbotWeekdayEnd, setChatbotWeekdayEnd] = useState("18:00");

  const { getCurrentUserInfo } = useContext(AuthContext);
  const { find, updateSchedules } = useCompanies();
  const { getAll: getAllSettings } = useSettings();

  useEffect(() => {
    async function findData() {
      setLoading(true);
      try {
        const companyId = localStorage.getItem("companyId");
        const company = await find(companyId);
        const settingList = await getAllSettings();
        setCompany(company);
        setSchedules(company.schedules);
        setSettings(settingList);

        if (Array.isArray(settingList)) {
          const scheduleType = settingList.find(
            (d) => d.key === "scheduleType"
          );
          if (scheduleType) {
            setSchedulesEnabled(scheduleType.value === "company");
          }
        }

        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
      setLoading(false);
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** URLs antigas ?tab=companies|plans|helps: limpar query sem quebrar navegação */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("tab");
    if (t === "companies" || t === "plans" || t === "helps") {
      history.replace("/settings");
    }
  }, [location.search, history]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("tab");
    if (t === "options") {
      history.replace({ pathname: "/settings", search: "?tab=notifications" });
      setTab("notifications");
      return;
    }
    if (!t) return;
    const allowed = ["schedules", "notifications"];
    if (!allowed.includes(t)) return;
    setTab(t);
  }, [location.search, history]);

  useEffect(() => {
    const canEdit =
      currentUser?.profile === "admin" || currentUser?.supportMode === true;
    if (!canEdit || !company?.id) return;
    let cancelled = false;
    setChatbotControlLoading(true);
    api
      .get("/companies/chatbot-control")
      .then(({ data }) => {
        if (cancelled) return;
        setChatbotControl(data || null);
        const mon = data?.chatbotSchedule?.days?.mon?.[0];
        if (mon?.start) setChatbotWeekdayStart(String(mon.start));
        if (mon?.end) setChatbotWeekdayEnd(String(mon.end));
      })
      .catch((err) => {
        if (cancelled) return;
        setChatbotControl(null);
        toastError(err);
      })
      .finally(() => {
        if (!cancelled) setChatbotControlLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company?.id, currentUser?.profile, currentUser?.supportMode]);

  const handleSaveChatbotControl = async () => {
    if (!company?.id) return;
    setChatbotControlSaving(true);
    try {
      const enabled = Boolean(chatbotControl?.chatbotScheduleEnabled);
      const schedule =
        enabled
          ? {
              timezone: chatbotControl?.timezone || company?.timezone,
              days: {
                mon: [{ start: chatbotWeekdayStart, end: chatbotWeekdayEnd }],
                tue: [{ start: chatbotWeekdayStart, end: chatbotWeekdayEnd }],
                wed: [{ start: chatbotWeekdayStart, end: chatbotWeekdayEnd }],
                thu: [{ start: chatbotWeekdayStart, end: chatbotWeekdayEnd }],
                fri: [{ start: chatbotWeekdayStart, end: chatbotWeekdayEnd }],
                sat: [],
                sun: [],
              },
            }
          : null;

      const { data } = await api.put("/companies/chatbot-control", {
        chatbotDisabled: Boolean(chatbotControl?.chatbotDisabled),
        chatbotScheduleEnabled: enabled,
        chatbotSchedule: schedule,
      });
      setChatbotControl(data || null);
      toast.success(i18n.t("settings.chatbotControl.toasts.saved"));
    } catch (err) {
      toastError(err);
    } finally {
      setChatbotControlSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
      async function findData() {
        setLoading(true);
        try {
          const companyId = localStorage.getItem("companyId");
          const company = await find(companyId);
          const settingList = await getAllSettings();
          setCompany(company);
          setSchedules(company.schedules);
          setSettings(settingList);
  
          if (Array.isArray(settingList)) {
            const scheduleType = settingList.find(
              (d) => d.key === "scheduleType"
            );
            if (scheduleType) {
              setSchedulesEnabled(scheduleType.value === "company");
            }
          }
  
          const user = await getCurrentUserInfo();
          setCurrentUser(user);
        } catch (e) {
          toast.error(e);
        }
        setLoading(false);
      }
      findData();
      // eslint-disable-next-line react-hooks/exhaustive-deps

    setTab(newValue);
  };

  const handleSubmitSchedules = async (data) => {
    setLoading(true);
    try {
      setSchedules(data);
      await updateSchedules({ id: company.id, schedules: data });
      toast.success(i18n.t("settings.schedulesUpdated"));
    } catch (e) {
      toast.error(e);
    }
    setLoading(false);
  };

  const showPlatformIntegrations =
    currentUser?.profile === "superadmin" || currentUser?.super === true;
  const showGroupManagerButton =
    currentUser?.profile === "admin" ||
    currentUser?.profile === "supervisor" ||
    currentUser?.supportMode === true;
  const showChatbotControl =
    (currentUser?.profile === "admin" || currentUser?.supportMode === true) &&
    Boolean(company?.id);
  const showNotificationsTab = Boolean(currentUser?.super || currentUser?.companyId);
  const showSettingsTabs = schedulesEnabled || showNotificationsTab;

  const effectiveTab = useMemo(() => {
    if (tab === "schedules" && schedulesEnabled) return "schedules";
    if (tab === "notifications" && showNotificationsTab) return "notifications";
    if (schedulesEnabled) return "schedules";
    if (showNotificationsTab) return "notifications";
    return "schedules";
  }, [tab, schedulesEnabled, showNotificationsTab]);

  return (
    <MainContainer className={classes.root}>
      <AppPageHeader
        title={
          <Typography variant="h5" color="primary" component="h1">
            {i18n.t("settings.title")}
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="textSecondary" component="p">
            {i18n.t("settings.pageSubtitle")}
          </Typography>
        }
      />
      <Paper className={classes.mainPaper} elevation={1}>
        <Box className={classes.pageSectionsStack}>
          {company?.id ? (
            <Paper elevation={1} className={classes.sectionPaper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {i18n.t("settings.sections.generalTitle")}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p" style={{ marginBottom: 16 }}>
                {i18n.t("settings.sections.generalDescription")}
              </Typography>
              <Box mt={2}>
                <CompanyTimezoneSettings
                  company={company}
                  onSaved={(c) => setCompany(c)}
                  embedded
                />
              </Box>
            </Paper>
          ) : null}

          <Box className={classes.pageContextWrap} style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="textSecondary" style={{ flex: 1, lineHeight: 1.5 }}>
                {i18n.t("settings.ux.pageContextShort")}
              </Typography>
              <Tooltip title={i18n.t("settings.customPageIntro")}>
                <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
                  <InfoOutlined fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <Box className={classes.pageContextWrap} paddingBottom={1}>
              <AppSectionCard>
                <Typography className={classes.superCardTitle} component="h2">
                  {i18n.t("settings.superPlatformCard.title")}
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ lineHeight: 1.5, margin: 0 }}>
                  {i18n.t("settings.superPlatformCard.body")}
                </Typography>
                <Box className={classes.superLinks}>
                  {PLATFORM_QUICK_LINKS.map((link) => (
                    <Button
                      key={link.to}
                      variant="outlined"
                      color="primary"
                      size="small"
                      component={RouterLink}
                      to={link.to}
                    >
                      {i18n.t(link.labelKey)}
                    </Button>
                  ))}
                </Box>
              </AppSectionCard>
            </Box>
          )}
        />

        <Options
          variant="main"
          settings={settings}
          scheduleTypeChanged={(value) =>
            setSchedulesEnabled(value === "company")
          }
          showPlatformIntegrations={showPlatformIntegrations}
          showGroupManagerButton={showGroupManagerButton}
          showChatbotControl={showChatbotControl}
          chatbotControl={chatbotControl}
          setChatbotControl={setChatbotControl}
          chatbotControlLoading={chatbotControlLoading}
          chatbotControlSaving={chatbotControlSaving}
          chatbotWeekdayStart={chatbotWeekdayStart}
          setChatbotWeekdayStart={setChatbotWeekdayStart}
          chatbotWeekdayEnd={chatbotWeekdayEnd}
          setChatbotWeekdayEnd={setChatbotWeekdayEnd}
          onSaveChatbotControl={handleSaveChatbotControl}
        />

          {(currentUser?.profile === "admin" || currentUser?.supportMode === true) &&
          company?.id ? (
            <Paper elevation={1} className={classes.sectionPaper}>
              <Box className={classes.sectionCardHeaderRow}>
                <Box flex={1} minWidth={0}>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("settings.sections.crmTitle")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {i18n.t("settings.sections.crmDescription")}
                  </Typography>
                </Box>
                <Tooltip title={i18n.t("settings.company.crmVisibility.description")}>
                  <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
                    <InfoOutlined fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box mt={2}>
                <CompanyCrmVisibilitySettings
                  embedded
                  company={company}
                  canEdit
                  onSaved={(c) => setCompany({ ...company, ...c })}
                />
              </Box>
              <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 16 }}>
                {i18n.t("settings.ux.saveCardHint")}
              </Typography>
            </Paper>
          ) : null}

          {(currentUser?.profile === "admin" || currentUser?.supportMode === true) &&
          company?.id ? (
            <Paper elevation={1} className={classes.sectionPaper}>
              <Box className={classes.sectionCardHeaderRow}>
                <Box flex={1} minWidth={0}>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("settings.sections.storageTitle")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {i18n.t("settings.sections.storageDescription")}
                  </Typography>
                </Box>
                <Tooltip title={i18n.t("settings.mediaManagerCard.description")}>
                  <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
                    <InfoOutlined fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box mt={2} className={classes.mediaManagerCard}>
                <Box className={classes.mediaManagerIconWrap} aria-hidden>
                  <PermMediaIcon className={classes.mediaManagerIcon} color="primary" />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => history.push("/settings/media-manager")}
                  >
                    {i18n.t("settings.mediaManagerCard.openButton")}
                  </Button>
                </Box>
              </Box>
            </Paper>
          ) : null}

        {showPlatformIntegrations ? (
          <Options
            variant="integrations"
            settings={settings}
            showPlatformIntegrations={showPlatformIntegrations}
            scheduleTypeChanged={() => {}}
          />
        ) : null}

        {showSettingsTabs ? (
          <>
            <Tabs
              value={effectiveTab}
              indicatorColor="primary"
              textColor="primary"
              scrollButtons="on"
              variant="scrollable"
              onChange={handleTabChange}
              className={classes.tab}
            >
              {schedulesEnabled ? (
                <Tab label={i18n.t("settings.tabs.schedules")} value={"schedules"} />
              ) : null}
              {showNotificationsTab ? (
                <Tab label={i18n.t("settings.tabs.notifications")} value={"notifications"} />
              ) : null}
            </Tabs>
            <Paper className={classes.paper} elevation={0}>
              <TabPanel
                className={classes.container}
                value={effectiveTab}
                name={"schedules"}
              >
                <SchedulesForm
                  loading={loading}
                  onSubmit={handleSubmitSchedules}
                  initialValues={schedules}
                />
              </TabPanel>
              <TabPanel
                className={classes.container}
                value={effectiveTab}
                name={"notifications"}
              >
                <PushNotificationPreferences />
              </TabPanel>
            </Paper>
          </>
        ) : null}
        </Box>
      </Paper>
    </MainContainer>
  );
};

export default SettingsCustom;
