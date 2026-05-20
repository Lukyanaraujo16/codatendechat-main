import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { showSuccessToast } from "../../errors/feedbackToasts";

function pickCommon(rows, field) {
  if (!rows.length) return undefined;
  const first = rows[0][field];
  const allSame = rows.every((r) => r[field] === first);
  return allSame ? first : undefined;
}

export default function useWhatsappBehaviorSettings(enabled) {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const { data } = await api.get("/whatsapps/settings-behavior");
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      setSelectedIds(list.map((r) => r.id));
    } catch (err) {
      toastError(err);
      setRows([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds]
  );

  const mixedValues = useMemo(() => {
    if (selectedRows.length <= 1) return false;
    const fields = [
      "callHandlingMode",
      "sendMessageOnCallReject",
      "callRejectMessage",
      "groupMessagesMode",
    ];
    return fields.some((f) => pickCommon(selectedRows, f) === undefined);
  }, [selectedRows]);

  const bulkUpdate = useCallback(
    async (settings, successToastKey) => {
      if (!enabled || selectedIds.length === 0) return;
      setSaving(true);
      try {
        const { data } = await api.put("/whatsapps/settings-behavior/bulk", {
          whatsappIds: selectedIds,
          settings,
        });
        if (Array.isArray(data?.connections)) {
          setRows(data.connections);
        } else {
          await load();
        }
        if (successToastKey) {
          showSuccessToast(successToastKey);
        }
      } catch (err) {
        toastError(err);
      } finally {
        setSaving(false);
      }
    },
    [enabled, selectedIds, load]
  );

  const applySelection = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(rows.map((r) => r.id));
  }, [rows]);

  const pickCommonForSelected = useCallback(
    (field) => pickCommon(selectedRows, field),
    [selectedRows]
  );

  return {
    rows,
    selectedIds,
    selectedRows,
    loading,
    saving,
    mixedValues,
    bulkUpdate,
    applySelection,
    selectAll,
    reload: load,
    pickCommonForSelected,
  };
}
