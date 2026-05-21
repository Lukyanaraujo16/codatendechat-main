import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import NotificationsIcon from "@material-ui/icons/Notifications";
import clsx from "clsx";

import { PulsingNotificationBadge } from "../NotificationPopoverLayout";
import NotificationCenterPanel from "../NotificationCenter/NotificationCenterPanel";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useGlobalNotifications } from "../../context/GlobalNotifications/GlobalNotificationsContext";
import { logNotificationMetric } from "../../utils/globalNotificationMetrics";
import {
  loadNotificationCenterTab,
  saveNotificationCenterTab,
} from "../../utils/notificationCenterUtils";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  popoverPaper: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    backgroundColor: "transparent",
    boxShadow: "none",
    overflow: "visible",
  },
  bellButton: {
    color: "rgba(0, 0, 0, 0.54)",
    transition: "transform 0.25s ease",
  },
  bellPulse: {
    animation: "$bellReceive 0.55s ease",
  },
  "@keyframes bellReceive": {
    "0%": { transform: "scale(1)" },
    "35%": { transform: "scale(1.15) rotate(-8deg)" },
    "70%": { transform: "scale(1.05) rotate(4deg)" },
    "100%": { transform: "scale(1)" },
  },
}));

const NotificationsPopOver = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const {
    notifications,
    unreadCount,
    markAsReadByChat,
    markAsReadByTicket,
    markAllAsRead,
  } = useGlobalNotifications();

  const history = useHistory();
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(loadNotificationCenterTab);
  const [bellPulse, setBellPulse] = useState(false);
  const prevUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setBellPulse(true);
      const t = setTimeout(() => setBellPulse(false), 600);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
    return undefined;
  }, [unreadCount]);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    saveNotificationCenterTab(tab);
  }, []);

  const handleItemClick = useCallback(
    (notification) => {
      logNotificationMetric("notification_opened", {
        type: notification.type,
        id: notification.id,
        ticketId: notification.ticketId,
        chatId: notification.chatId,
      });

      if (notification.type === "internalChat") {
        markAsReadByChat({
          chatId: notification.chatId,
          chatUuid: notification.chatUuid,
        });
      } else {
        markAsReadByTicket({
          ticketId: notification.ticketId,
          ticketUuid: notification.ticketUuid,
        });
      }

      if (notification.targetUrl) {
        history.push(notification.targetUrl);
      }
      setIsOpen(false);
    },
    [history, markAsReadByChat, markAsReadByTicket]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  if (!user?.id) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        ref={anchorEl}
        aria-label={i18n.t("notificationCenter.title")}
        color="inherit"
        className={clsx(classes.bellButton, bellPulse && classes.bellPulse)}
      >
        <PulsingNotificationBadge hasNotification={unreadCount > 0}>
          <NotificationsIcon />
        </PulsingNotificationBadge>
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <NotificationCenterPanel
          notifications={notifications}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
        />
      </Popover>
    </>
  );
};

export default NotificationsPopOver;
