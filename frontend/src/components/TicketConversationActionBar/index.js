import React, { useState } from "react";

import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles, alpha, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import clsx from "clsx";

import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import SwapHorizIcon from "@material-ui/icons/SwapHoriz";
import EventIcon from "@material-ui/icons/Event";
import UndoRoundedIcon from "@material-ui/icons/UndoRounded";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import AccountTreeIcon from "@material-ui/icons/AccountTree";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import MoreVertIcon from "@material-ui/icons/MoreVert";

import { i18n } from "../../translate/i18n";
import ButtonWithSpinner from "../ButtonWithSpinner";
import TicketFlowExecutionLogModal from "../TicketFlowExecutionLogModal";
import { Can } from "../Can";

const MICRO_MS = 180;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "flex-end",
    maxWidth: "100%",
    marginLeft: "auto",
    marginRight: theme.spacing(0.5),
    gap: theme.spacing(1),
    minWidth: 0,
    [theme.breakpoints.down("xs")]: {
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      paddingBottom: theme.spacing(0.5),
      justifyContent: "flex-start",
    },
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  moreMenuBtn: {
    transition: `all ${MICRO_MS}ms ease`,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resolveContained: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 600,
    transition: `all ${MICRO_MS}ms ease`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.35)}`,
    "&:hover": {
      backgroundColor: theme.palette.success.dark,
      transform: "translateY(-1px)",
      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.4)}`,
    },
  },
  resolveIconOnly: {
    minWidth: 40,
    padding: theme.spacing(0.75),
  },
  transferOutlined: {
    textTransform: "none",
    borderRadius: 999,
    transition: `all ${MICRO_MS}ms ease`,
    "&:hover": {
      transform: "translateY(-1px)",
    },
  },
  transferIconCompact: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.primary.main,
    transition: `all ${MICRO_MS}ms ease`,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  menuDelete: {
    color: theme.palette.error.main,
  },
  menuExtras: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 0),
  },
}));

/**
 * Barra de ações do ticket (status open) — Transferir + Resolver visíveis; demais no menu ⋮.
 */
const TicketConversationActionBar = ({
  loading,
  userProfile,
  onResolve,
  onReturn,
  onScheduleClick,
  onTransferClick,
  onDeleteClick,
  onQuickRepliesClick,
  ticketId,
  extraIconActions,
  showDelete,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [menuAnchor, setMenuAnchor] = useState(null);

  const openMenu = (event) => setMenuAnchor(event.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const runMenuAction = (fn) => (event) => {
    closeMenu();
    if (typeof fn === "function") {
      fn(event);
    }
  };

  return (
    <div className={classes.root} data-ticket-action-bar>
      <div className={classes.actionGroup}>
        <Tooltip title={i18n.t("ticketOptionsMenu.transfer")}>
          {compact ? (
            <IconButton
              size="small"
              onClick={onTransferClick}
              className={classes.transferIconCompact}
              aria-label={i18n.t("ticketOptionsMenu.transfer")}
            >
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              className={classes.transferOutlined}
              startIcon={<SwapHorizIcon />}
              onClick={onTransferClick}
            >
              {i18n.t("ticketOptionsMenu.transfer")}
            </Button>
          )}
        </Tooltip>

        <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
          <span>
            {compact ? (
              <ButtonWithSpinner
                loading={loading}
                size="small"
                variant="contained"
                className={clsx(classes.resolveContained, classes.resolveIconOnly)}
                onClick={onResolve}
                aria-label={i18n.t("messagesList.header.buttons.resolve")}
              >
                <CheckCircleIcon fontSize="small" />
              </ButtonWithSpinner>
            ) : (
              <ButtonWithSpinner
                loading={loading}
                size="small"
                variant="contained"
                className={classes.resolveContained}
                startIcon={<CheckCircleIcon />}
                onClick={onResolve}
              >
                {i18n.t("messagesList.header.buttons.resolve")}
              </ButtonWithSpinner>
            )}
          </span>
        </Tooltip>

        <Tooltip title={i18n.t("ticketOptionsMenu.moreActions")}>
          <IconButton
            size="small"
            className={classes.moreMenuBtn}
            onClick={openMenu}
            aria-label={i18n.t("ticketOptionsMenu.moreActions")}
            aria-haspopup="true"
            aria-controls="ticket-action-menu"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <Menu
        id="ticket-action-menu"
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={runMenuAction(onReturn)} disabled={loading}>
          <ListItemIcon>
            {loading ? (
              <CircularProgress size={18} />
            ) : (
              <UndoRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText primary={i18n.t("messagesList.header.buttons.return")} />
        </MenuItem>

        {ticketId ? (
          <TicketFlowExecutionLogModal
            ticketId={ticketId}
            renderTrigger={(open) => (
              <MenuItem onClick={runMenuAction(open)}>
                <ListItemIcon>
                  <AccountTreeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={i18n.t("messagesList.header.buttons.flowHistory")}
                />
              </MenuItem>
            )}
          />
        ) : null}

        {typeof onQuickRepliesClick === "function" ? (
          <MenuItem onClick={runMenuAction(onQuickRepliesClick)} disabled={loading}>
            <ListItemIcon>
              <FlashOnIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={i18n.t("messagesList.header.buttons.quickReplies")}
            />
          </MenuItem>
        ) : null}

        <MenuItem onClick={runMenuAction(onScheduleClick)}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={i18n.t("ticketOptionsMenu.schedule")} />
        </MenuItem>

        {extraIconActions ? (
          <MenuItem disabled style={{ opacity: 1 }}>
            <div className={classes.menuExtras}>{extraIconActions}</div>
          </MenuItem>
        ) : null}

        {showDelete === true ? (
          <MenuItem onClick={runMenuAction(onDeleteClick)} className={classes.menuDelete}>
            <ListItemIcon className={classes.menuDelete}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={i18n.t("ticketOptionsMenu.delete")} />
          </MenuItem>
        ) : showDelete === false ? null : (
          <Can
            role={userProfile}
            perform="ticket-options:deleteTicket"
            yes={() => (
              <MenuItem
                onClick={runMenuAction(onDeleteClick)}
                className={classes.menuDelete}
              >
                <ListItemIcon className={classes.menuDelete}>
                  <DeleteOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={i18n.t("ticketOptionsMenu.delete")} />
              </MenuItem>
            )}
          />
        )}
      </Menu>
    </div>
  );
};

export default TicketConversationActionBar;
