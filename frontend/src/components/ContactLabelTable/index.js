import React from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { i18n } from "../../translate/i18n";
import ContactLabelChip from "../ContactLabelChip";
import { formatLabelLastUsed } from "../../utils/formatLabelLastUsed";
import { canDeleteContactLabels } from "../../utils/canManageContactLabels";
import {
  AppTableContainer,
  AppTableRowSkeleton,
  AppEmptyState,
} from "../../ui";

export default function ContactLabelTable({
  rows,
  loading,
  user,
  onEdit,
  onDelete,
}) {
  const canDelete = canDeleteContactLabels(user);

  if (loading && !rows.length) {
    return (
      <AppTableContainer>
        <Table size="medium">
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <AppTableRowSkeleton key={i} columns={8} />
            ))}
          </TableBody>
        </Table>
      </AppTableContainer>
    );
  }

  if (!loading && !rows.length) {
    return (
      <AppEmptyState
        title={i18n.t("contactLabelsManage.empty.title")}
        description={i18n.t("contactLabelsManage.empty.subtitle")}
      />
    );
  }

  return (
    <AppTableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>{i18n.t("contactLabelsManage.table.color")}</TableCell>
            <TableCell>{i18n.t("contactLabelsManage.table.name")}</TableCell>
            <TableCell>{i18n.t("contactLabelsManage.table.description")}</TableCell>
            <TableCell align="center">
              {i18n.t("contactLabelsManage.table.contacts")}
            </TableCell>
            <TableCell>{i18n.t("contactLabelsManage.table.createdBy")}</TableCell>
            <TableCell>{i18n.t("contactLabelsManage.table.createdAt")}</TableCell>
            <TableCell>{i18n.t("contactLabelsManage.table.lastUsed")}</TableCell>
            <TableCell align="center">
              {i18n.t("contactLabelsManage.table.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const createdAt = row.createdAt
              ? parseISO(
                  typeof row.createdAt === "string"
                    ? row.createdAt
                    : new Date(row.createdAt).toISOString()
                )
              : null;
            return (
              <TableRow key={row.id} hover>
                <TableCell>
                  <ContactLabelChip label={row} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary" noWrap style={{ maxWidth: 200 }}>
                    {row.description || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="center">{row.contactCount ?? 0}</TableCell>
                <TableCell>{row.createdByName || "—"}</TableCell>
                <TableCell>
                  {createdAt && isValid(createdAt)
                    ? format(createdAt, "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="textSecondary">
                    {formatLabelLastUsed(row.lastUsedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={i18n.t("contactLabelsManage.actions.edit")}>
                    <IconButton size="small" onClick={() => onEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canDelete ? (
                    <Tooltip title={i18n.t("contactLabelsManage.actions.delete")}>
                      <IconButton size="small" onClick={() => onDelete(row)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AppTableContainer>
  );
}

ContactLabelTable.propTypes = {
  rows: PropTypes.array,
  loading: PropTypes.bool,
  user: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
