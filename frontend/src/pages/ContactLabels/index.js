import React, { useCallback, useContext, useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import AddIcon from "@material-ui/icons/Add";

import MainContainer from "../../components/MainContainer";
import {
  AppPageHeader,
  AppSectionCard,
  AppPrimaryButton,
} from "../../ui";
import ContactLabelTable from "../../components/ContactLabelTable";
import ContactLabelForm from "../../components/ContactLabelForm";
import ContactLabelDeleteModal from "../../components/ContactLabelDeleteModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { canManageContactLabels } from "../../utils/canManageContactLabels";

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    flex: 1,
    minHeight: 0,
  },
  statCard: {
    padding: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
    background:
      theme.palette.type === "dark"
        ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.9)})`
        : `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.06)})`,
    boxShadow:
      theme.palette.type === "dark"
        ? "none"
        : "0 2px 8px rgba(0,0,0,0.04)",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginTop: theme.spacing(0.5),
    letterSpacing: "-0.02em",
  },
  filtersRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    alignItems: "center",
  },
}));

function StatCard({ label, value }) {
  const classes = useStyles();
  return (
    <Paper className={classes.statCard} elevation={0}>
      <Typography className={classes.statLabel}>{label}</Typography>
      <Typography className={classes.statValue}>{value}</Typography>
    </Paper>
  );
}

export default function ContactLabels() {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    contactsTagged: 0,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParam, setSearchParam] = useState("");
  const [usageFilter, setUsageFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteLabel, setDeleteLabel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        api.get("/contact-labels/stats"),
        api.get("/contact-labels/manage", {
          params: {
            searchParam: searchParam.trim() || undefined,
            usageFilter,
          },
        }),
      ]);
      setStats(statsRes.data || {});
      setRows(Array.isArray(listRes.data) ? listRes.data : []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, [searchParam, usageFilter]);

  useEffect(() => {
    const t = setTimeout(load, searchParam ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, searchParam]);

  if (!canManageContactLabels(user)) {
    return <Redirect to="/tickets" />;
  }

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setFormOpen(true);
  };

  return (
    <MainContainer>
      <div className={classes.pageRoot}>
        <AppPageHeader
          title={i18n.t("contactLabelsManage.title")}
          subtitle={i18n.t("contactLabelsManage.subtitle")}
          actions={
            <AppPrimaryButton startIcon={<AddIcon />} onClick={openCreate}>
              {i18n.t("contactLabelsManage.newLabel")}
            </AppPrimaryButton>
          }
        />

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <StatCard
              label={i18n.t("contactLabelsManage.stats.total")}
              value={stats.total ?? 0}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label={i18n.t("contactLabelsManage.stats.used")}
              value={stats.used ?? 0}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label={i18n.t("contactLabelsManage.stats.contactsTagged")}
              value={stats.contactsTagged ?? 0}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label={i18n.t("contactLabelsManage.stats.unused")}
              value={stats.unused ?? 0}
            />
          </Grid>
        </Grid>

        <AppSectionCard variant="outlined" dense>
          <Box className={classes.filtersRow}>
            <TextField
              size="small"
              variant="outlined"
              placeholder={i18n.t("contactLabelsManage.search")}
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
              style={{ minWidth: 220, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl variant="outlined" size="small" style={{ minWidth: 160 }}>
              <InputLabel id="usage-filter-label">
                {i18n.t("contactLabelsManage.filter.label")}
              </InputLabel>
              <Select
                labelId="usage-filter-label"
                value={usageFilter}
                onChange={(e) => setUsageFilter(e.target.value)}
                label={i18n.t("contactLabelsManage.filter.label")}
              >
                <MenuItem value="all">
                  {i18n.t("contactLabelsManage.filter.all")}
                </MenuItem>
                <MenuItem value="used">
                  {i18n.t("contactLabelsManage.filter.used")}
                </MenuItem>
                <MenuItem value="unused">
                  {i18n.t("contactLabelsManage.filter.unused")}
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AppSectionCard>

        <AppSectionCard scrollable variant="outlined">
          <ContactLabelTable
            rows={rows}
            loading={loading}
            user={user}
            onEdit={openEdit}
            onDelete={setDeleteLabel}
          />
        </AppSectionCard>
      </div>

      <ContactLabelForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        labelId={editId}
        onSaved={load}
      />

      <ContactLabelDeleteModal
        open={Boolean(deleteLabel)}
        onClose={() => setDeleteLabel(null)}
        label={deleteLabel}
        otherLabels={rows}
        onDeleted={load}
      />
    </MainContainer>
  );
}
