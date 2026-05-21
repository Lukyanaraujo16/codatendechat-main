import React from "react";
import { makeStyles, Button, Typography, Box } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 280,
    maxWidth: 360,
    padding: theme.spacing(0.5, 0),
  },
  title: {
    fontWeight: 600,
    fontSize: "0.9rem",
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.primary,
  },
  body: {
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.35,
    marginBottom: theme.spacing(1),
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1),
  },
}));

export default function GlobalNotificationToast({
  title,
  body,
  onOpen,
  closeToast,
}) {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Typography className={classes.title}>{title}</Typography>
      <Typography className={classes.body}>{body}</Typography>
      <div className={classes.actions}>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            if (typeof onOpen === "function") onOpen();
            if (typeof closeToast === "function") closeToast();
          }}
        >
          {i18n.t("globalNotifications.open")}
        </Button>
      </div>
    </Box>
  );
}
