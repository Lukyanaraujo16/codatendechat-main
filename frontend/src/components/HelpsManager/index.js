import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  makeStyles,
  Paper,
  Grid,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Formik, Form, Field } from "formik";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";
import { Edit as EditIcon, CloudUpload as CloudUploadIcon } from "@material-ui/icons";
import { toast } from "react-toastify";
import useHelps from "../../hooks/useHelps";
import { i18n } from "../../translate/i18n";
import HelpVideoCard from "../HelpVideoCard";
import {
  HELP_CATEGORIES,
  normalizeCategory,
  resolveHelpThumbnailUrl
} from "../../utils/helpThumbnail";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%"
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2)
  },
  fullWidth: {
    width: "100%"
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    ...theme.scrollbarStyles
  },
  textfield: {
    width: "100%"
  },
  row: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1)
  },
  thumbnailPreview: {
    width: "100%",
    maxWidth: 280,
    aspectRatio: "16 / 9",
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default
  },
  thumbnailPlaceholder: {
    width: "100%",
    maxWidth: 280,
    aspectRatio: "16 / 9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.shape.borderRadius,
    border: `1px dashed ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.default
  },
  uploadRow: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1)
  },
  previewPanel: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default
  },
  previewTitle: {
    fontWeight: 700,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary
  },
  helperText: {
    color: theme.palette.text.secondary,
    fontSize: "0.8rem",
    marginTop: theme.spacing(0.5)
  }
}));

const emptyRecord = {
  title: "",
  description: "",
  video: "",
  thumbnailUrl: "",
  category: "Atendimento",
  order: 0,
  isFeatured: false
};

export function HelpManagerForm(props) {
  const {
    onSubmit,
    onDelete,
    onCancel,
    initialValue,
    loading,
    onUploadThumbnail,
    categoryOptions = HELP_CATEGORIES
  } = props;
  const classes = useStyles();
  const fileInputRef = useRef(null);
  const [record, setRecord] = useState(initialValue);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    setRecord(initialValue);
  }, [initialValue]);

  const handleSubmit = async (data) => {
    onSubmit(data);
  };

  const handleThumbnailPick = async (event, setFieldValue) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(i18n.t("settings.helps.form.thumbnailInvalid"));
      return;
    }

    setUploadingThumb(true);
    try {
      const { thumbnailUrl } = await onUploadThumbnail(file);
      setFieldValue("thumbnailUrl", thumbnailUrl);
      setRecord((prev) => ({ ...prev, thumbnailUrl }));
      toast.success(i18n.t("settings.helps.form.thumbnailUploaded"));
    } catch {
      toast.error(i18n.t("settings.helps.toasts.error"));
    }
    setUploadingThumb(false);
    event.target.value = "";
  };

  return (
    <Formik
      enableReinitialize
      className={classes.fullWidth}
      initialValues={record}
      onSubmit={(values, { resetForm }) =>
        setTimeout(() => {
          handleSubmit(values);
          resetForm();
        }, 300)
      }
    >
      {({ values, setFieldValue }) => {
        const thumbPreview = resolveHelpThumbnailUrl(values);

        return (
        <Form className={classes.fullWidth}>
          <Grid spacing={2} container>
            <Grid xs={12} lg={5} item>
              <Box className={classes.previewPanel}>
                <Typography variant="subtitle1" className={classes.previewTitle}>
                  {i18n.t("settings.helps.form.livePreview")}
                </Typography>
                <HelpVideoCard
                  record={values}
                  featured={Boolean(values.isFeatured)}
                  showFeaturedBadge={Boolean(values.isFeatured)}
                  preview
                />
              </Box>
            </Grid>

            <Grid xs={12} lg={7} item>
              <Grid spacing={2} container>
            <Grid xs={12} md={5} item>
              <Box className={classes.uploadRow}>
                {thumbPreview ? (
                  <img
                    src={thumbPreview}
                    alt=""
                    className={classes.thumbnailPreview}
                  />
                ) : (
                  <Box className={classes.thumbnailPlaceholder}>
                    <Typography variant="caption" color="textSecondary">
                      {i18n.t("settings.helps.form.thumbnailEmpty")}
                    </Typography>
                  </Box>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleThumbnailPick(e, setFieldValue)}
                />
                <ButtonWithSpinner
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  loading={uploadingThumb}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {i18n.t("settings.helps.form.uploadThumbnail")}
                </ButtonWithSpinner>
                <Typography className={classes.helperText}>
                  {i18n.t("settings.helps.form.thumbnailAutoHint")}
                </Typography>
                {values.thumbnailUrl ? (
                  <ButtonWithSpinner
                    variant="text"
                    size="small"
                    onClick={() => setFieldValue("thumbnailUrl", "")}
                  >
                    {i18n.t("settings.helps.form.removeThumbnail")}
                  </ButtonWithSpinner>
                ) : null}
              </Box>
            </Grid>

            <Grid xs={12} md={7} item>
              <Grid spacing={2} container>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={TextField}
                    label={i18n.t("settings.helps.grid.title")}
                    name="title"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                  />
                </Grid>
                <Grid xs={12} sm={6} item>
                  <Field
                    as={TextField}
                    label={i18n.t("settings.helps.grid.video")}
                    name="video"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                    helperText={i18n.t("settings.helps.form.videoHint")}
                  />
                </Grid>
                <Grid xs={12} sm={6} item>
                  <Autocomplete
                    freeSolo
                    options={categoryOptions}
                    value={values.category || "Atendimento"}
                    onChange={(_e, newValue) =>
                      setFieldValue(
                        "category",
                        normalizeCategory({ category: newValue || "Atendimento" })
                      )
                    }
                    onInputChange={(_e, inputValue, reason) => {
                      if (reason === "input") {
                        setFieldValue("category", inputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={i18n.t("settings.helps.form.category")}
                        variant="outlined"
                        margin="dense"
                        className={classes.fullWidth}
                        helperText={i18n.t("settings.helps.form.categoryHint")}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={3} item>
                  <Field
                    as={TextField}
                    type="number"
                    label={i18n.t("settings.helps.form.order")}
                    name="order"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                    inputProps={{ min: 0 }}
                    helperText={i18n.t("settings.helps.form.orderHint")}
                  />
                </Grid>
                <Grid xs={12} sm={3} item>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={Boolean(values.isFeatured)}
                        onChange={(e) =>
                          setFieldValue("isFeatured", e.target.checked)
                        }
                      />
                    }
                    label={i18n.t("settings.helps.form.featured")}
                  />
                </Grid>
                <Grid xs={12} item>
                  <Field
                    as={TextField}
                    label={i18n.t("settings.helps.grid.description")}
                    name="description"
                    variant="outlined"
                    className={classes.fullWidth}
                    margin="dense"
                    multiline
                    minRows={2}
                  />
                </Grid>
              </Grid>
            </Grid>
              </Grid>
            </Grid>

            <Grid xs={12} item className={classes.buttonContainer}>
              <ButtonWithSpinner
                loading={loading}
                onClick={() => onCancel()}
                variant="contained"
                style={{ marginRight: 8 }}
              >
                {i18n.t("settings.helps.buttons.clean")}
              </ButtonWithSpinner>
              {record.id !== undefined ? (
                <ButtonWithSpinner
                  loading={loading}
                  onClick={() => onDelete(record)}
                  variant="contained"
                  color="secondary"
                  style={{ marginRight: 8 }}
                >
                  {i18n.t("settings.helps.buttons.delete")}
                </ButtonWithSpinner>
              ) : null}
              <ButtonWithSpinner
                loading={loading}
                type="submit"
                variant="contained"
                color="primary"
              >
                {i18n.t("settings.helps.buttons.save")}
              </ButtonWithSpinner>
            </Grid>
          </Grid>
        </Form>
        );
      }}
    </Formik>
  );
}

export function HelpsManagerGrid(props) {
  const { records, onSelect } = props;
  const classes = useStyles();

  return (
    <Paper className={classes.tableContainer} elevation={0}>
      <Table className={classes.fullWidth} size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" style={{ width: "1%" }}>
              #
            </TableCell>
            <TableCell align="left">
              {i18n.t("settings.helps.grid.title")}
            </TableCell>
            <TableCell align="left">
              {i18n.t("settings.helps.form.category")}
            </TableCell>
            <TableCell align="center">
              {i18n.t("settings.helps.form.order")}
            </TableCell>
            <TableCell align="center">
              {i18n.t("settings.helps.form.featured")}
            </TableCell>
            <TableCell align="left">
              {i18n.t("settings.helps.grid.video")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell align="center" style={{ width: "1%" }}>
                <IconButton onClick={() => onSelect(row)} aria-label="edit">
                  <EditIcon />
                </IconButton>
              </TableCell>
              <TableCell align="left">{row.title || "-"}</TableCell>
              <TableCell align="left">{row.category || "-"}</TableCell>
              <TableCell align="center">{row.order ?? 0}</TableCell>
              <TableCell align="center">
                {row.isFeatured ? (
                  <Chip
                    size="small"
                    color="primary"
                    label={i18n.t("settings.helps.form.featuredShort")}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell align="left">{row.video || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function HelpsManager() {
  const classes = useStyles();
  const { list, save, update, remove, uploadThumbnail } = useHelps();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(emptyRecord);

  const categoryOptions = useMemo(() => {
    const fromRecords = records
      .map((r) => normalizeCategory(r))
      .filter((c) => c && c !== "Geral");
    return [...new Set([...HELP_CATEGORIES, ...fromRecords])];
  }, [records]);

  useEffect(() => {
    loadHelps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHelps = async () => {
    setLoading(true);
    try {
      const helpList = await list();
      setRecords(helpList);
    } catch {
      toast.error(i18n.t("settings.helps.toasts.errorList"));
    }
    setLoading(false);
  };

  const normalizePayload = (data) => ({
    ...data,
    order: Number(data.order) || 0,
    isFeatured: Boolean(data.isFeatured),
    category: data.category || "Atendimento",
    thumbnailUrl: data.thumbnailUrl || ""
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = normalizePayload(data);
      if (data.id !== undefined) {
        await update(payload);
      } else {
        await save(payload);
      }
      await loadHelps();
      handleCancel();
      toast.success(i18n.t("settings.helps.toasts.success"));
    } catch {
      toast.error(i18n.t("settings.helps.toasts.error"));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await remove(record.id);
      await loadHelps();
      handleCancel();
      toast.success(i18n.t("settings.helps.toasts.success"));
    } catch {
      toast.error(i18n.t("settings.helps.toasts.errorOperation"));
    }
    setLoading(false);
    setShowConfirmDialog(false);
  };

  const handleOpenDeleteDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleCancel = () => {
    setRecord({ ...emptyRecord });
  };

  const handleSelect = (data) => {
    setRecord({
      id: data.id,
      title: data.title || "",
      description: data.description || "",
      video: data.video || "",
      thumbnailUrl: data.thumbnailUrl || "",
      category: data.category || "Atendimento",
      order: data.order ?? 0,
      isFeatured: Boolean(data.isFeatured)
    });
  };

  return (
    <Paper className={classes.mainPaper} elevation={0}>
      <Grid spacing={2} container>
        <Grid xs={12} item>
          <HelpManagerForm
            initialValue={record}
            onDelete={handleOpenDeleteDialog}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onUploadThumbnail={uploadThumbnail}
            categoryOptions={categoryOptions}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} item>
          <HelpsManagerGrid records={records} onSelect={handleSelect} />
        </Grid>
      </Grid>
      <ConfirmationModal
        title={i18n.t("settings.helps.confirmModal.title")}
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => handleDelete()}
      >
        {i18n.t("settings.helps.confirmModal.confirm")}
      </ConfirmationModal>
    </Paper>
  );
}
