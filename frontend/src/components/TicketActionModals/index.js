import React, { useEffect, useRef, useState } from "react";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import ScheduleModal from "../ScheduleModal";

/**
 * Encapsula modais de agendamento, transferência e exclusão de ticket.
 * Usa render props: children({ openSchedule, openDelete })
 */
const TicketActionModals = ({
  ticket,
  children,
  deleteTitle,
  deleteMessage,
  onDeleted,
}) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const isMounted = useRef(true);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
      if (isMounted.current) {
        setConfirmationOpen(false);
      }
      toast.success(
        i18n.t("ticketOptionsMenu.confirmationModal.deleteSuccess")
      );
      if (typeof onDeleted === "function") {
        onDeleted();
      }
    } catch (err) {
      toastError(err);
    }
  };

  const openDelete = () => {
    setConfirmationOpen(true);
  };

  const openSchedule = () => {
    if (!ticket.contact?.id) return;
    setContactId(ticket.contact.id);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setContactId(null);
  };

  return (
    <>
      {typeof children === "function"
        ? children({ openSchedule, openDelete })
        : children}
      <ConfirmationModal
        title={
          deleteTitle ||
          `${i18n.t("ticketOptionsMenu.confirmationModal.title")}${
            ticket.id
          } ${i18n.t("ticketOptionsMenu.confirmationModal.titleFrom")} ${
            ticket.contact?.name || ""
          }?`
        }
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={handleDeleteTicket}
      >
        {deleteMessage || i18n.t("ticketOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        aria-labelledby="form-dialog-title"
        contactId={contactId}
      />
    </>
  );
};

export default TicketActionModals;
