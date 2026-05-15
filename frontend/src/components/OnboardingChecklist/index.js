import React from "react";
import {
  makeStyles,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  IconButton,
  Tooltip
} from "@material-ui/core";
import { fade } from "@material-ui/core/styles/colorManipulator";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import SchoolIcon from "@material-ui/icons/School";
import CloseIcon from "@material-ui/icons/Close";
import { useHistory } from "react-router-dom";
import { i18n } from "../../translate/i18n";
import useOnboardingProgress from "../../hooks/useOnboardingProgress";

const STEP_CONFIG = [
  { id: "whatsapp", route: "/connections" },
  { id: "queues", route: "/queues" },
  { id: "users", route: "/users" },
  { id: "greeting", route: "/queues" },
  { id: "flow", route: "/flowbuilders" },
  { id: "firstTicket", route: "/tickets" }
];

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2.5),
    borderRadius: 12,
    height: "100%",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1]
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
    gap: theme.spacing(1)
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: fade(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5)
  },
  progressLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.8125rem",
    marginTop: theme.spacing(1)
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.25, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:last-child": {
      borderBottom: "none"
    }
  },
  stepDone: {
    color: theme.palette.success.main
  },
  stepPending: {
    color: theme.palette.text.disabled
  },
  stepText: {
    flex: 1,
    color: theme.palette.text.primary,
    fontSize: "0.9rem"
  },
  stepActions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    flexShrink: 0
  },
  footer: {
    marginTop: theme.spacing(2),
    display: "flex",
    justifyContent: "flex-end"
  }
}));

export default function OnboardingChecklist() {
  const classes = useStyles();
  const history = useHistory();
  const {
    loading,
    steps,
    hidden,
    dismiss,
    getTutorialForStep,
    completedCount,
    totalSteps,
    isAdmin
  } = useOnboardingProgress();

  if (!isAdmin || hidden) {
    return null;
  }

  const progressPercent =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const openTutorial = (help) => {
    if (!help?.id) {
      history.push("/helps");
      return;
    }
    history.push("/helps", { openHelpId: help.id });
  };

  return (
    <Paper className={classes.root} elevation={0}>
      <Box className={classes.header}>
        <Box>
          <Box className={classes.titleRow}>
            <Box className={classes.iconWrap}>
              <SchoolIcon />
            </Box>
            <Typography variant="h6">
              {i18n.t("onboarding.title")}
            </Typography>
          </Box>
          <Typography variant="body2" className={classes.subtitle}>
            {i18n.t("onboarding.subtitle")}
          </Typography>
          <Typography className={classes.progressLabel}>
            {i18n.t("onboarding.progress", {
              done: completedCount,
              total: totalSteps
            })}
          </Typography>
          <LinearProgress
            variant={loading ? "indeterminate" : "determinate"}
            value={progressPercent}
            style={{ marginTop: 8, borderRadius: 4 }}
          />
        </Box>
        <Tooltip title={i18n.t("onboarding.hideGuide")}>
          <IconButton size="small" onClick={dismiss} aria-label="hide">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box>
        {STEP_CONFIG.map(({ id, route }) => {
          const done = Boolean(steps[id]);
          const tutorial = getTutorialForStep(id);

          return (
            <Box key={id} className={classes.step}>
              {done ? (
                <CheckCircleIcon
                  fontSize="small"
                  className={classes.stepDone}
                />
              ) : (
                <RadioButtonUncheckedIcon
                  fontSize="small"
                  className={classes.stepPending}
                />
              )}
              <Typography className={classes.stepText}>
                {i18n.t(`onboarding.steps.${id}`)}
              </Typography>
              <Box className={classes.stepActions}>
                {tutorial ? (
                  <Button
                    size="small"
                    onClick={() => openTutorial(tutorial)}
                  >
                    {i18n.t("onboarding.tutorial")}
                  </Button>
                ) : null}
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  endIcon={<OpenInNewIcon />}
                  onClick={() => history.push(route)}
                >
                  {i18n.t("onboarding.open")}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box className={classes.footer}>
        <Button size="small" onClick={dismiss} color="default">
          {i18n.t("onboarding.hideGuide")}
        </Button>
      </Box>
    </Paper>
  );
}
