import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import InfoOutlined from "@material-ui/icons/InfoOutlined";
import Divider from "@material-ui/core/Divider";
import useSettings from "../../hooks/useSettings";
import { ToastContainer, toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { i18n } from "../../translate/i18n";
import { useHistory } from "react-router-dom";

//import 'react-toastify/dist/ReactToastify.css';
 
const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    backgroundColor: theme.palette.options,  //DARK MODE PLW DESIGN//
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: theme.palette.fontecor,
    },   //DARK MODE PLW DESIGN//
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  sectionPaper: {
    padding: theme.spacing(3),
    width: "100%",
  },
  sectionTitle: {
    fontWeight: 600,
  },
  sectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    width: "100%",
  },
  subSectionLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
  },
  subSectionLabelFirst: {
    marginTop: 0,
  },
  toggleHighlight: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255,255,255,0.04)"
        : theme.palette.grey[50],
  },
  autoSaveFooter: {
    marginTop: theme.spacing(2),
    display: "block",
  },
  saveHintFooter: {
    marginTop: theme.spacing(2),
    display: "block",
  },
}));

export default function Options(props) {
  const {
    variant = "main",
    settings,
    scheduleTypeChanged,
    showPlatformIntegrations = false,
    showGroupManagerButton = false,
    showChatbotControl = false,
    chatbotControl,
    setChatbotControl,
    chatbotControlLoading = false,
    chatbotControlSaving = false,
    chatbotWeekdayStart = "08:00",
    setChatbotWeekdayStart,
    chatbotWeekdayEnd = "18:00",
    setChatbotWeekdayEnd,
    onSaveChatbotControl,
  } = props;
  const classes = useStyles();
  const history = useHistory();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [callRejectSendMessage, setCallRejectSendMessage] = useState("enabled");
  const [callRejectMessage, setCallRejectMessage] = useState("");
  const [chatbotType, setChatbotType] = useState("");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingCallRejectSendMessage, setLoadingCallRejectSendMessage] = useState(false);
  const [loadingCallRejectMessage, setLoadingCallRejectMessage] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingCheckMsgIsGroup, setCheckMsgIsGroup] = useState(false);


  //const [ipixcType, setIpIxcType] = useState("");
  //const [loadingIpIxcType, setLoadingIpIxcType] = useState(false);
  //const [tokenixcType, setTokenIxcType] = useState("");
  //const [loadingTokenIxcType, setLoadingTokenIxcType] = useState(false);

  //const [ipmkauthType, setIpMkauthType] = useState("");
  //const [loadingIpMkauthType, setLoadingIpMkauthType] = useState(false);
  //const [clientidmkauthType, setClientIdMkauthType] = useState("");
  //const [loadingClientIdMkauthType, setLoadingClientIdMkauthType] = useState(false);
  //const [clientsecretmkauthType, setClientSecrectMkauthType] = useState("");
  //const [loadingClientSecrectMkauthType, setLoadingClientSecrectMkauthType] = useState(false);

  const [asaasType, setAsaasType] = useState("");
  const [loadingAsaasType, setLoadingAsaasType] = useState(false);
  
  // recursos a mais da plw design

  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("disabled");
  const [loadingSendGreetingAccepted, setLoadingSendGreetingAccepted] = useState(false);
  
  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("disabled");
  const [loadingSettingsTransfTicket, setLoadingSettingsTransfTicket] = useState(false);
  
  const [sendGreetingMessageOneQueues, setSendGreetingMessageOneQueues] = useState("disabled");
  const [loadingSendGreetingMessageOneQueues, setLoadingSendGreetingMessageOneQueues] = useState(false);

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const crs = settings.find((s) => s.key === "callRejectSendMessage");
      setCallRejectSendMessage(crs ? crs.value : "enabled");
      const crm = settings.find((s) => s.key === "callRejectMessage");
      setCallRejectMessage(crm && crm.value != null ? String(crm.value) : "");
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }
	  
	  {/*PLW DESIGN SAUDAÇÃO*/}
      const SendGreetingAccepted = settings.find((s) => s.key === "sendGreetingAccepted");
      if (SendGreetingAccepted) {
        setSendGreetingAccepted(SendGreetingAccepted.value);
      }	 
	  {/*PLW DESIGN SAUDAÇÃO*/}	 
	  
	  {/*TRANSFERIR TICKET*/}	
	  const SettingsTransfTicket = settings.find((s) => s.key === "sendMsgTransfTicket");
      if (SettingsTransfTicket) {
        setSettingsTransfTicket(SettingsTransfTicket.value);
      }
	  {/*TRANSFERIR TICKET*/}

      const sendGreetingMessageOneQueues = settings.find((s) => s.key === "sendGreetingMessageOneQueues");
      if (sendGreetingMessageOneQueues) {
        setSendGreetingMessageOneQueues(sendGreetingMessageOneQueues.value)
      }	  
	  
      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      }

	    {/*const ipixcType = settings.find((s) => s.key === "ipixc");
      if (ipixcType) {
        setIpIxcType(ipixcType.value);
      }*/}

      {/*const tokenixcType = settings.find((s) => s.key === "tokenixc");
      if (tokenixcType) {
        setTokenIxcType(tokenixcType.value);
      }*/}

      {/*const ipmkauthType = settings.find((s) => s.key === "ipmkauth");
      if (ipmkauthType) {
        setIpMkauthType(ipmkauthType.value);
      }*/}

     {/* const clientidmkauthType = settings.find((s) => s.key === "clientidmkauth");
      if (clientidmkauthType) {
        setClientIdMkauthType(clientidmkauthType.value);
      }*/}

      {/*const clientsecretmkauthType = settings.find((s) => s.key === "clientsecretmkauth");
      if (clientsecretmkauthType) {
        setClientSecrectMkauthType(clientsecretmkauthType.value);
      }*/}

      const asaasType = settings.find((s) => s.key === "asaas");
      if (asaasType) {
        setAsaasType(asaasType.value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingUserRating(false);
  }
  
    async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      key: "sendGreetingMessageOneQueues",
      value,
    });
	toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    //toast.success("Oraçãpeo atualizada com sucesso.");
    toast.success(i18n.t("settings.options.toasts.success"), {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: "light",
      });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingCallType(false);
  }

  async function handleCallRejectSendMessage(value) {
    setCallRejectSendMessage(value);
    setLoadingCallRejectSendMessage(true);
    await update({
      key: "callRejectSendMessage",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingCallRejectSendMessage(false);
  }

  async function handleCallRejectMessageSave() {
    setLoadingCallRejectMessage(true);
    await update({
      key: "callRejectMessage",
      value: callRejectMessage,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingCallRejectMessage(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingChatbotType(false);
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    setCheckMsgIsGroup(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setCheckMsgIsGroup(false);
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }
  
  {/*NOVO CÓDIGO*/}  
  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      key: "sendGreetingAccepted",
      value,
    });
	toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSendGreetingAccepted(false);
  }  
  
  
  {/*NOVO CÓDIGO*/}    

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      key: "sendMsgTransfTicket",
      value,
    });

    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSettingsTransfTicket(false);
  } 
 
 {/*async function handleChangeIPIxc(value) {
    setIpIxcType(value);
    setLoadingIpIxcType(true);
    await update({
      key: "ipixc",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingIpIxcType(false);
  }

   {/*async function handleChangeTokenIxc(value) {
    setTokenIxcType(value);
    setLoadingTokenIxcType(true);
    await update({
      key: "tokenixc",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingTokenIxcType(false);
  }

  async function handleChangeIpMkauth(value) {
    setIpMkauthType(value);
    setLoadingIpMkauthType(true);
    await update({
      key: "ipmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingIpMkauthType(false);
  }

  async function handleChangeClientIdMkauth(value) {
    setClientIdMkauthType(value);
    setLoadingClientIdMkauthType(true);
    await update({
      key: "clientidmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingClientIdMkauthType(false);
  }

  async function handleChangeClientSecrectMkauth(value) {
    setClientSecrectMkauthType(value);
    setLoadingClientSecrectMkauthType(true);
    await update({
      key: "clientsecretmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingClientSecrectMkauthType(false);
  }*/}

  async function handleChangeAsaas(value) {
    setAsaasType(value);
    setLoadingAsaasType(true);
    await update({
      key: "asaas",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingAsaasType(false);
  }

  if (variant === "integrations") {
    if (!showPlatformIntegrations) {
      return null;
    }
    return (
      <Box className={classes.sectionStack}>
        <Paper elevation={1} className={classes.sectionPaper}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={2}>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {i18n.t("settings.sections.integrationsTitle")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {i18n.t("settings.sections.integrationsDescription")}
              </Typography>
            </Box>
            <Tooltip title={i18n.t("settings.sections.tooltips.integrations")}>
              <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
                <InfoOutlined fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} mb={2}>
            <Typography variant="subtitle2" className={classes.subSectionLabelFirst}>
              {i18n.t("settings.sections.asaasTitle")}
            </Typography>
            <Tooltip title={i18n.t("settings.sections.tooltips.asaasNotice")}>
              <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
                <InfoOutlined fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            id="asaas"
            name="asaas"
            margin="dense"
            label={i18n.t("settings.sections.asaasTokenLabel")}
            variant="outlined"
            fullWidth
            value={asaasType}
            onChange={async (e) => {
              handleChangeAsaas(e.target.value);
            }}
            helperText={loadingAsaasType ? i18n.t("settings.options.updating") : undefined}
          />
          <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
            {i18n.t("settings.ux.autoSaveHint")}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const sectionHeader = (titleId, taglineId, tooltipKey) => (
    <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={2}>
      <Box flex={1} minWidth={0}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {i18n.t(titleId)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {i18n.t(taglineId)}
        </Typography>
      </Box>
      <Tooltip title={i18n.t(tooltipKey)}>
        <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
          <InfoOutlined fontSize="small" color="action" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box className={classes.sectionStack}>
      <Paper elevation={1} className={classes.sectionPaper}>
        {sectionHeader(
          "settings.sections.ratingsScheduleTitle",
          "settings.sections.ratingsScheduleDescription",
          "settings.sections.tooltips.ratingsSchedule"
        )}
        <Grid spacing={3} container>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="ratings-label">{i18n.t("settings.options.fields.ratings.title")}</InputLabel>
              <Select
                labelId="ratings-label"
                value={userRating}
                onChange={async (e) => {
                  handleChangeUserRating(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.ratings.disabled")}</MenuItem>
                <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.ratings.enabled")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingUserRating && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="schedule-type-label">
                {i18n.t("settings.options.fields.expedientManager.title")}
              </InputLabel>
              <Select
                labelId="schedule-type-label"
                value={scheduleType}
                onChange={async (e) => {
                  handleScheduleType(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
                <MenuItem value={"queue"}>{i18n.t("settings.options.fields.expedientManager.queue")}</MenuItem>
                <MenuItem value={"company"}>{i18n.t("settings.options.fields.expedientManager.company")}</MenuItem>
              </Select>
              <FormHelperText>
                {scheduleType === "company"
                  ? i18n.t("settings.options.expedientCompanyWarningShort")
                  : loadingScheduleType && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
          {i18n.t("settings.ux.autoSaveHint")}
        </Typography>
      </Paper>

      <Paper elevation={1} className={classes.sectionPaper}>
        {sectionHeader(
          "settings.sections.attendanceCallsCardTitle",
          "settings.sections.callsDescription",
          "settings.sections.tooltips.callsCard"
        )}
        <Grid spacing={2} container>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer} fullWidth>
              <InputLabel id="call-type-label">
                {i18n.t("settings.options.fields.acceptCall.title")}
              </InputLabel>
              <Select
                labelId="call-type-label"
                value={callType}
                onChange={async (e) => {
                  handleCallType(e.target.value);
                }}
              >
                <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.acceptCall.enabled")}</MenuItem>
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.acceptCall.disabled")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingCallType && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
          {callType === "disabled" && (
            <>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer} fullWidth>
                  <InputLabel id="call-reject-send-label">
                    {i18n.t("settings.options.fields.acceptCall.rejectSendTitle")}
                  </InputLabel>
                  <Select
                    labelId="call-reject-send-label"
                    value={callRejectSendMessage}
                    onChange={async (e) => {
                      handleCallRejectSendMessage(e.target.value);
                    }}
                  >
                    <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.acceptCall.rejectSendYes")}</MenuItem>
                    <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.acceptCall.rejectSendNo")}</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingCallRejectSendMessage && i18n.t("settings.options.updating")}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} item>
                <TextField
                  label={i18n.t("settings.options.fields.acceptCall.rejectMessageLabel")}
                  placeholder={i18n.t("settings.options.fields.acceptCall.rejectMessagePlaceholder")}
                  value={callRejectMessage}
                  onChange={(e) => setCallRejectMessage(e.target.value)}
                  onBlur={() => handleCallRejectMessageSave()}
                  disabled={callRejectSendMessage === "disabled"}
                  multiline
                  minRows={2}
                  variant="outlined"
                  fullWidth
                  helperText={
                    loadingCallRejectMessage
                      ? i18n.t("settings.options.updating")
                      : i18n.t("settings.options.fields.acceptCall.rejectMessageHelper")
                  }
                />
              </Grid>
            </>
          )}
        </Grid>
        <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
          {i18n.t("settings.ux.autoSaveHint")}
        </Typography>
      </Paper>

      <Paper elevation={1} className={classes.sectionPaper}>
        {sectionHeader(
          "settings.sections.attendanceGroupsCardTitle",
          "settings.sections.groupsConfigDescription",
          "settings.sections.tooltips.groupsCard"
        )}
        {showGroupManagerButton ? (
          <Box mb={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => history.push("/settings/groups")}
            >
              {i18n.t("settings.sections.groupManagerButton")}
            </Button>
          </Box>
        ) : null}
        <Grid spacing={2} container>
          <Grid xs={12} sm={12} md={6} item>
            <FormControl className={classes.selectContainer} fullWidth>
              <InputLabel id="group-type-label">
                {i18n.t("settings.options.fields.ignoreMessages.title")}
              </InputLabel>
              <Select
                labelId="group-type-label"
                value={CheckMsgIsGroup}
                onChange={async (e) => {
                  handleGroupType(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.options.fields.ignoreMessages.optionReceive")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.options.fields.ignoreMessages.optionIgnore")}
                </MenuItem>
              </Select>
              <FormHelperText>
                {loadingCheckMsgIsGroup && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
          {i18n.t("settings.ux.autoSaveHint")}
        </Typography>
      </Paper>

      <Paper elevation={1} className={classes.sectionPaper}>
        {sectionHeader(
          "settings.sections.attendanceAutoMsgCardTitle",
          "settings.sections.autoMessagesDescription",
          "settings.sections.tooltips.autoMessagesCard"
        )}
        <Grid spacing={2} container>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="sendGreetingAccepted-label">
                {i18n.t("settings.options.fields.sendGreetingAccepted.title")}
              </InputLabel>
              <Select
                labelId="sendGreetingAccepted-label"
                value={SendGreetingAccepted}
                onChange={async (e) => {
                  handleSendGreetingAccepted(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
                <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingSendGreetingAccepted && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="sendMsgTransfTicket-label">
                {i18n.t("settings.options.fields.sendMsgTransfTicket.title")}
              </InputLabel>
              <Select
                labelId="sendMsgTransfTicket-label"
                value={SettingsTransfTicket}
                onChange={async (e) => {
                  handleSettingsTransfTicket(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
                <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingSettingsTransfTicket && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="sendGreetingMessageOneQueues-label">
                {i18n.t("settings.options.fields.sendGreetingMessageOneQueues.title")}
              </InputLabel>
              <Select
                labelId="sendGreetingMessageOneQueues-label"
                value={sendGreetingMessageOneQueues}
                onChange={async (e) => {
                  handleSendGreetingMessageOneQueues(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
                <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingSendGreetingMessageOneQueues && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
          {i18n.t("settings.ux.autoSaveHint")}
        </Typography>
      </Paper>

      <Paper elevation={1} className={classes.sectionPaper}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={2}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {i18n.t("settings.sections.chatbotAutomationTitle")}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {i18n.t("settings.sections.chatbotAutomationDescription")}
            </Typography>
          </Box>
          <Tooltip title={i18n.t("settings.sections.tooltips.chatbotAutomation")}>
            <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
              <InfoOutlined fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>

        {showChatbotControl ? (
          <>
            <Typography variant="subtitle2" className={classes.subSectionLabelFirst}>
              {i18n.t("settings.sections.chatbotSectionStateTitle")}
            </Typography>
            <Box className={classes.toggleHighlight}>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    size="medium"
                    checked={Boolean(chatbotControl?.chatbotDisabled)}
                    onChange={(e) =>
                      setChatbotControl((prev) => ({
                        ...(prev || {}),
                        chatbotDisabled: e.target.checked,
                      }))
                    }
                    disabled={chatbotControlLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" component="span" style={{ fontWeight: 600 }}>
                      {i18n.t("settings.chatbotControl.disableCompany")}
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box className={classes.toggleHighlight}>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    size="medium"
                    checked={Boolean(chatbotControl?.chatbotScheduleEnabled)}
                    onChange={(e) =>
                      setChatbotControl((prev) => ({
                        ...(prev || {}),
                        chatbotScheduleEnabled: e.target.checked,
                      }))
                    }
                    disabled={chatbotControlLoading}
                  />
                }
                label={
                  <Typography variant="body1" component="span" style={{ fontWeight: 600 }}>
                    {i18n.t("settings.chatbotControl.enableSchedule")}
                  </Typography>
                }
              />
              {Boolean(chatbotControl?.chatbotScheduleEnabled) && (
                <Box mt={2} display="flex" flexWrap="wrap" alignItems="flex-end" style={{ gap: 12 }}>
                  <TextField
                    label={i18n.t("settings.chatbotControl.weekdayStart")}
                    type="time"
                    value={chatbotWeekdayStart}
                    onChange={(e) => setChatbotWeekdayStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    variant="outlined"
                    size="small"
                    helperText={i18n.t("settings.chatbotControl.weekdaysHint")}
                  />
                  <TextField
                    label={i18n.t("settings.chatbotControl.weekdayEnd")}
                    type="time"
                    value={chatbotWeekdayEnd}
                    onChange={(e) => setChatbotWeekdayEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
            </Box>
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                onClick={onSaveChatbotControl}
                disabled={chatbotControlSaving || chatbotControlLoading}
              >
                {chatbotControlSaving
                  ? i18n.t("settings.chatbotControl.buttons.saving")
                  : i18n.t("settings.chatbotControl.buttons.save")}
              </Button>
              <Typography variant="caption" color="textSecondary" display="block" className={classes.saveHintFooter}>
                {i18n.t("settings.ux.saveCardHint")}
              </Typography>
            </Box>
          </>
        ) : null}

        {showChatbotControl ? (
          <Divider style={{ marginTop: 24, marginBottom: 16 }} />
        ) : null}

        <Typography variant="subtitle2" className={showChatbotControl ? classes.subSectionLabel : classes.subSectionLabelFirst}>
          {i18n.t("settings.sections.chatbotSectionMessagesTitle")}
        </Typography>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <Typography variant="body2" color="textSecondary" style={{ flex: 1 }}>
            {i18n.t("settings.sections.chatbotFlowDescription")}
          </Typography>
          <Tooltip title={i18n.t("settings.sections.tooltips.chatbotFlow")}>
            <IconButton size="small" aria-label={i18n.t("settings.ux.moreInfoAria")}>
              <InfoOutlined fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        <Grid spacing={2} container alignItems="flex-end">
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer} fullWidth>
              <InputLabel id="chatbot-type-label">
                {i18n.t("settings.options.fields.chatbotType.title")}
              </InputLabel>
              <Select
                labelId="chatbot-type-label"
                value={chatbotType}
                onChange={async (e) => {
                  handleChatbotType(e.target.value);
                }}
              >
                <MenuItem value={"text"}>{i18n.t("settings.options.fields.chatbotType.text")}</MenuItem>
              </Select>
              <FormHelperText>
                {loadingChatbotType && i18n.t("settings.options.updating")}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} item>
            <Button variant="outlined" color="primary" onClick={() => history.push("/flowbuilders")}>
              {i18n.t("settings.sections.openFlowsButton")}
            </Button>
          </Grid>
        </Grid>
        <Typography variant="caption" color="textSecondary" className={classes.autoSaveFooter}>
          {i18n.t("settings.ux.autoSaveHint")}
        </Typography>
      </Paper>
      {/*-----------------IXC DESATIVADO 4.6.5-----------------*/}
      {/*<Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab

            label="IXC" />

        </Tabs>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipixc"
              name="ipixc"
              margin="dense"
              label="IP do IXC"
              variant="outlined"
              value={ipixcType}
              onChange={async (e) => {
                handleChangeIPIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpIxcType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="tokenixc"
              name="tokenixc"
              margin="dense"
              label="Token do IXC"
              variant="outlined"
              value={tokenixcType}
              onChange={async (e) => {
                handleChangeTokenIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingTokenIxcType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>*/}
      {/*-----------------MK-AUTH DESATIVADO 4.6.5-----------------*/}
      {/*<Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="MK-AUTH" />

        </Tabs>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipmkauth"
              name="ipmkauth"
              margin="dense"
              label="Ip Mk-Auth"
              variant="outlined"
              value={ipmkauthType}
              onChange={async (e) => {
                handleChangeIpMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientidmkauth"
              name="clientidmkauth"
              margin="dense"
              label="Client Id"
              variant="outlined"
              value={clientidmkauthType}
              onChange={async (e) => {
                handleChangeClientIdMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientIdMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientsecretmkauth"
              name="clientsecretmkauth"
              margin="dense"
              label="Client Secret"
              variant="outlined"
              value={clientsecretmkauthType}
              onChange={async (e) => {
                handleChangeClientSecrectMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientSecrectMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>*/}
    </Box>
  );
}
