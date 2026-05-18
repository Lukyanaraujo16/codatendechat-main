import React, { useState, useEffect, useReducer, useContext, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { toast } from "react-toastify";
import { AppEmptyState } from "../../ui";
import ConfirmationModal from "../ConfirmationModal";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { canDeleteTickets } from "../../utils/canDeleteTickets";

/**
 * Lista de tickets usada na tela de Atendimentos (fluxo atual).
 * Preferir este componente a `TicketsList` (legado).
 */
import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsInboxContext } from "../../context/TicketsInboxContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import {
  PANEL_RADIUS,
  LIST_SIDE_PADDING_PX,
  getTicketPanelScrollbarStyles,
} from "../../theme/ticketPanelStyles";

const useStyles = makeStyles((theme) => ({
  ticketsListWrapper: {
    position: "relative",
    display: "flex",
    flex: 1,
    minHeight: 0,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderBottomLeftRadius: PANEL_RADIUS,
  },

  ticketsList: {
    flex: 1,
    minHeight: 0,
    maxHeight: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    scrollbarGutter: "stable",
    boxSizing: "border-box",
    ...getTicketPanelScrollbarStyles(theme),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    padding: `0 ${LIST_SIDE_PADDING_PX}px ${LIST_SIDE_PADDING_PX}px ${LIST_SIDE_PADDING_PX}px`,
    paddingRight: LIST_SIDE_PADDING_PX + 2,
    borderBottomLeftRadius: PANEL_RADIUS,
  },

  ticketsListHeader: {
    color: theme.palette.text.primary,
    zIndex: 2,
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketsCount: {
    fontWeight: "normal",
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(1),
    fontSize: "0.875rem",
  },

  bulkToolbar: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    borderRadius: 10,
    backgroundColor: theme.palette.background.paper,
    padding: "8px 12px",
    margin: `8px ${LIST_SIDE_PADDING_PX}px 12px ${LIST_SIDE_PADDING_PX}px`,
    overflow: "hidden",
    flexShrink: 0,
    boxSizing: "border-box",
    border: `1px solid ${theme.palette.divider}`,
  },
  bulkToolbarLabel: {
    flex: 1,
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
  },

  emptyStateWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    padding: theme.spacing(4, 2),
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_TICKETS") {
    const newTickets = action.payload;

    newTickets.forEach((ticket) => {
      const ticketIndex = state.findIndex((t) => t.id === ticket.id);
      if (ticketIndex !== -1) {
        state[ticketIndex] = ticket;
        if (ticket.unreadMessages > 0) {
          state.unshift(state.splice(ticketIndex, 1)[0]);
        }
      } else {
        state.push(ticket);
      }
    });

    return [...state];
  }

  if (action.type === "RESET_UNREAD") {
    const ticketId = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticketId);
    if (ticketIndex !== -1) {
      state[ticketIndex] = { ...state[ticketIndex], unreadMessages: 0 };
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      state[ticketIndex] = ticket;
    } else {
      state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      state[ticketIndex] = ticket;
      state.unshift(state.splice(ticketIndex, 1)[0]);
    } else {
      state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_CONTACT") {
    const contact = action.payload;
    const ticketIndex = state.findIndex((t) => t.contactId === contact.id);
    if (ticketIndex !== -1) {
      const prev = state[ticketIndex];
      state[ticketIndex] = { ...prev, contact };
    }
    return [...state];
  }

  if (action.type === "DELETE_TICKET") {
    const ticketId = action.payload;
    const ticketIndex = state.findIndex((t) => t.id === ticketId);
    if (ticketIndex !== -1) {
      state.splice(ticketIndex, 1);
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const TicketsListCustom = (props) => {
  const {
    status,
    searchParam,
    tags,
    users,
    showAll,
    selectedQueueIds,
    chatbotOnly = false,
    /** Apenas tickets de grupo (guia Grupos); não mistura com atendimentos 1:1 */
    groupsOnly = false,
    updateCount,
    style,
    /** Lista mais densa (Fase 3) */
    compact = false,
    // false: não registra socket (ex.: lista oculta na mesma aba com outras instâncias)
    socketActive = true,
    /** Inbox: tickets vindos do TicketsInboxContext (sem reducer/socket local). */
    controlledTickets,
    controlledLoading = false,
    controlledHasMore = false,
    onControlledLoadMore,
    enableBulkDelete = false,
  } = props;
  const classes = useStyles();
  const { ticketId: routeTicketId } = useParams();
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const { user } = useContext(AuthContext);
  const inbox = useContext(TicketsInboxContext);
  const { profile, queues } = user || {};
  const safeQueues = Array.isArray(queues) ? queues : [];

  const socketManager = useContext(SocketContext);

  const isControlled = Array.isArray(controlledTickets);

  useEffect(() => {
    if (isControlled) return;
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [isControlled, status, searchParam, dispatch, showAll, tags, users, selectedQueueIds, groupsOnly]);

  const { tickets, hasMore, loading } = useTickets({
    enabled: !isControlled,
    pageNumber,
    searchParam,
    status: groupsOnly ? undefined : status,
    showAll: groupsOnly ? true : showAll,
    tags: JSON.stringify(tags),
    users: JSON.stringify(users),
    queueIds: JSON.stringify(selectedQueueIds),
    isGroup: groupsOnly ? "true" : undefined,
  });

  useEffect(() => {
    if (isControlled) return;
    const qIds = safeQueues.map((q) => q.id);
    const filteredTickets = tickets.filter((t) => {
      if (profile !== "user" || groupsOnly) return true;
      const myId = Number(user?.id);
      const assigneeRaw = t.userId;
      const assignee =
        assigneeRaw != null && assigneeRaw !== ""
          ? Number(assigneeRaw)
          : null;
      if (assignee != null && !Number.isNaN(assignee) && assignee === myId) {
        return true;
      }
      if (assignee != null && !Number.isNaN(assignee)) {
        return false;
      }
      if (!t.queueId) {
        return user?.allTicket === "enabled";
      }
      return qIds.indexOf(t.queueId) > -1;
    });

    let base =
      profile === "user" && !groupsOnly ? filteredTickets : tickets;
    if (!groupsOnly) {
      base = base.filter((t) => !t.isGroup);
    } else {
      base = base.filter((t) => t.isGroup);
    }

    /** pending: separar "Aguardando" (!chatbot) de "Chatbot" (chatbot); evita o mesmo ticket nas duas abas */
    const applyPendingChatbotSplit = (list) => {
      if (groupsOnly || status !== "pending") return list;
      return chatbotOnly
        ? list.filter((t) => !!t.chatbot)
        : list.filter((t) => !t.chatbot);
    };

    dispatch({
      type: "LOAD_TICKETS",
      payload: applyPendingChatbotSplit(base),
    });
  }, [isControlled, tickets, status, searchParam, safeQueues, profile, chatbotOnly, groupsOnly, user?.id, user?.allTicket]);

  const displayTickets = isControlled ? controlledTickets : ticketsList;
  const displayLoading = isControlled ? controlledLoading : loading;
  const displayHasMore = isControlled ? controlledHasMore : hasMore;

  useEffect(() => {
    if (isControlled || !socketActive) return undefined;

    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    const shouldUpdateTicket = (ticket) => {
      if (groupsOnly) return true;
      const myId = Number(user?.id);
      if (showAll) return true;
      const assigneeRaw = ticket?.userId;
      const assignee =
        assigneeRaw != null && assigneeRaw !== ""
          ? Number(assigneeRaw)
          : null;
      if (assignee != null && !Number.isNaN(assignee) && assignee === myId) {
        return true;
      }
      if (assignee != null && !Number.isNaN(assignee)) {
        return false;
      }
      if (!ticket.queueId) {
        return user?.allTicket === "enabled";
      }
      return selectedQueueIds.indexOf(ticket.queueId) > -1;
    };

    /** Mesma regra da lista inicial: em pending, Chatbot vs Aguardando são mutuamente exclusivos */
    const matchesPendingChatbotTab = (ticket) => {
      if (groupsOnly || status !== "pending") return true;
      return chatbotOnly ? !!ticket.chatbot : !ticket.chatbot;
    };

    const matchesTabStatus = (ticket) => {
      if (groupsOnly) {
        return (
          ticket.isGroup &&
          ticket.status !== "closed"
        );
      }
      /** Busca (sem status): aceita qualquer status, alinhado ao handler antigo de appMessage */
      if (status === undefined || status === null) {
        return true;
      }
      return ticket.status === status;
    };

    socket.on("ready", () => {
      if (groupsOnly) {
        socket.emit("joinTickets", "open");
        socket.emit("joinTickets", "pending");
      } else if (status) {
        socket.emit("joinTickets", status);
      } else {
        socket.emit("joinNotification");
      }
    });

    const ticketFitsThisList = (ticket) => {
      if (!ticket) return false;
      if (groupsOnly) {
        return ticket.isGroup && ticket.status !== "closed";
      }
      if (!shouldUpdateTicket(ticket) || ticket.isGroup) return false;
      if (!matchesTabStatus(ticket) || !matchesPendingChatbotTab(ticket)) return false;
      return true;
    };

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread") {
        dispatch({
          type: "RESET_UNREAD",
          payload: data.ticketId,
        });
      }

      if (data.action === "update" && data.ticket) {
        if (ticketFitsThisList(data.ticket)) {
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.debug("[ticketsList pending split]", {
              ticketId: data.ticket?.id,
              status: data.ticket?.status,
              chatbot: data.ticket?.chatbot,
              queueId: data.ticket?.queueId,
              chatbotOnly,
            });
          }
          dispatch({
            type: "UPDATE_TICKET",
            payload: data.ticket,
          });
        } else if (
          (groupsOnly && data.ticket.isGroup) ||
          (!groupsOnly && !data.ticket.isGroup)
        ) {
          /** Saiu desta aba (status/chatbot/fila) ou deixou de ser visível — remove sem F5 */
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (!groupsOnly && profile === "user") {
        const myId = Number(user?.id);
        const queueIds = safeQueues.map((q) => q.id);
        const assigneeRaw = data.ticket?.userId;
        const assignee =
          assigneeRaw != null && assigneeRaw !== ""
            ? Number(assigneeRaw)
            : null;
        if (assignee != null && !Number.isNaN(assignee) && assignee > 0) {
          if (assignee !== myId) return;
        } else {
          const qid = data.ticket?.queue?.id;
          if (qid == null) {
            if (user?.allTicket !== "enabled") return;
          } else if (queueIds.indexOf(qid) === -1) {
            return;
          }
        }
      }

      if (data.action === "create" && data.ticket) {
        if (ticketFitsThisList(data.ticket)) {
          dispatch({
            type: "UPDATE_TICKET_UNREAD_MESSAGES",
            payload: data.ticket,
          });
        } else if (
          (groupsOnly && data.ticket.isGroup) ||
          (!groupsOnly && !data.ticket.isGroup)
        ) {
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      if (data.action === "update") {
        dispatch({
          type: "UPDATE_TICKET_CONTACT",
          payload: data.contact,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [
    isControlled,
    socketActive,
    status,
    showAll,
    user?.id,
    user?.profile,
    selectedQueueIds,
    tags,
    users,
    profile,
    socketManager,
    chatbotOnly,
    groupsOnly,
    user?.allTicket,
    safeQueues,
  ]);

  useEffect(() => {
    if (isControlled || typeof updateCount !== "function") return;
    updateCount(ticketsList.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, ticketsList]);

  const loadMore = useCallback(() => {
    if (isControlled) {
      if (typeof onControlledLoadMore === "function") {
        onControlledLoadMore();
      }
      return;
    }
    setPageNumber((prevState) => prevState + 1);
  }, [isControlled, onControlledLoadMore]);

  const handleScroll = useCallback(
    (e) => {
      if (!displayHasMore || displayLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (scrollHeight - (scrollTop + 100) < clientHeight) {
        loadMore();
      }
    },
    [displayHasMore, displayLoading, loadMore]
  );

  const isRowSelected = useMemo(() => {
    if (!routeTicketId) return () => false;
    return (ticket) =>
      ticket.uuid === routeTicketId || String(ticket.id) === String(routeTicketId);
  }, [routeTicketId]);

  const bulkEnabled = enableBulkDelete && canDeleteTickets(user);
  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    displayTickets.length > 0 && selectedCount === displayTickets.length;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [status, chatbotOnly, groupsOnly, searchParam, selectedQueueIds]);

  const toggleBulkSelect = useCallback((ticketId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(displayTickets.map((t) => t.id)));
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const { data } = await api.delete("/tickets/batch", {
        data: { ticketIds: ids },
      });
      const deleted = data?.deletedCount ?? 0;
      const failed = data?.failedCount ?? 0;
      const removedIds =
        Array.isArray(data?.deletedIds) && data.deletedIds.length > 0
          ? data.deletedIds
          : ids;
      if (typeof inbox?.removeTickets === "function") {
        inbox.removeTickets(removedIds);
      }
      if (deleted === 0 && failed > 0) {
        toast.error(i18n.t("ticket.delete.bulkNoneFailed"));
      } else if (failed > 0) {
        toast.info(
          i18n.t("ticket.delete.bulkPartial", { deleted, failed })
        );
      } else {
        toast.success(i18n.t("ticket.delete.bulkSuccess", { deleted }));
      }
      setSelectedIds(new Set());
      setBulkConfirmOpen(false);
    } catch (err) {
      toastError(err);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <Paper className={classes.ticketsListWrapper} style={style} data-tickets-list-panel>
      {bulkEnabled ? (
        <Box className={classes.bulkToolbar} data-tickets-bulk-toolbar>
          <Checkbox
            color="primary"
            checked={allVisibleSelected}
            indeterminate={selectedCount > 0 && !allVisibleSelected}
            onChange={handleSelectAllVisible}
            inputProps={{ "aria-label": i18n.t("ticket.delete.selectAll") }}
          />
          <Typography className={classes.bulkToolbarLabel}>
            {selectedCount > 0
              ? i18n.t("ticket.delete.bulkSelected", { count: selectedCount })
              : i18n.t("ticket.delete.selectAll")}
          </Typography>
          {selectedCount > 0 ? (
            <Button
              size="small"
              color="secondary"
              variant="contained"
              disabled={bulkDeleting}
              onClick={() => setBulkConfirmOpen(true)}
            >
              {i18n.t("ticket.delete.bulkDeleteButton")}
            </Button>
          ) : null}
        </Box>
      ) : null}
      <ConfirmationModal
        title={i18n.t("ticket.delete.bulkConfirmTitle")}
        open={bulkConfirmOpen}
        onClose={setBulkConfirmOpen}
        onConfirm={handleBulkDelete}
      >
        {i18n.t("ticket.delete.bulkConfirmMessage", { count: selectedCount })}
      </ConfirmationModal>
      <Paper
        square
        name="closed"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
      >
        <List
          style={{
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
            width: "100%",
            boxSizing: "border-box",
            height: "100%",
          }}
        >
          {displayTickets.length === 0 && !displayLoading ? (
            <Box className={classes.emptyStateWrap}>
              <AppEmptyState
                title={i18n.t("ticketsList.emptyStateTitle")}
                description={i18n.t("ticketsList.emptyStateMessage")}
                hint={i18n.t("ticketsList.emptyStateHint")}
              />
            </Box>
          ) : (
            <>
              {displayTickets.map((ticket) => (
                <TicketListItem
                  ticket={ticket}
                  key={ticket.id}
                  compact={compact}
                  selected={isRowSelected(ticket)}
                  bulkSelectMode={bulkEnabled}
                  bulkSelected={selectedIds.has(ticket.id)}
                  onBulkToggle={toggleBulkSelect}
                />
              ))}
            </>
          )}
          {displayLoading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </Paper>
  );
};

export default TicketsListCustom;
