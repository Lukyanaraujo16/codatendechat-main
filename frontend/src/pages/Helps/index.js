import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  makeStyles,
  Paper,
  Typography,
  Modal,
  Button,
  Box,
  TextField,
  Chip,
  IconButton
} from "@material-ui/core";
import { fade } from "@material-ui/core/styles/colorManipulator";
import Skeleton from "@material-ui/lab/Skeleton";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import StarIcon from "@material-ui/icons/Star";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import HelpVideoCard from "../../components/HelpVideoCard";
import { i18n } from "../../translate/i18n";
import useHelps from "../../hooks/useHelps";
import { useLocation } from "react-router-dom";
import {
  FILTER_ALL,
  HELP_CATEGORIES,
  filterHelps,
  findBasicsHelp,
  groupHelpsByCategory,
  resolveHelpEmbedUrl,
  sortHelpsForPlayback
} from "../../utils/helpThumbnail";

const useStyles = makeStyles((theme) => ({
  content: {
    width: "100%",
    padding: theme.spacing(2),
    overflowY: "auto",
    maxHeight: "calc(100vh - 160px)",
    ...theme.scrollbarStyles
  },
  hero: {
    padding: theme.spacing(3, 3, 2.5),
    marginBottom: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${theme.palette.divider}`,
    background: `linear-gradient(135deg, ${fade(
      theme.palette.primary.main,
      theme.palette.type === "dark" ? 0.22 : 0.1
    )} 0%, ${theme.palette.background.paper} 55%)`
  },
  heroTitle: {
    fontWeight: 800,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1)
  },
  heroSubtitle: {
    color: theme.palette.text.secondary,
    maxWidth: 640,
    marginBottom: theme.spacing(2)
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
    alignItems: "center"
  },
  videoCount: {
    display: "inline-flex",
    alignItems: "center",
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 20,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: "0.875rem"
  },
  toolbar: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3)
  },
  searchField: {
    maxWidth: 420,
    "& .MuiOutlinedInput-root": {
      backgroundColor: theme.palette.background.paper
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.divider
    }
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1)
  },
  categoryChip: {
    fontWeight: 600
  },
  section: {
    marginBottom: theme.spacing(4)
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 700,
    color: theme.palette.text.primary,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  featuredGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: theme.spacing(2.5)
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: theme.spacing(2.5)
  },
  emptyState: {
    padding: theme.spacing(5),
    textAlign: "center",
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  },
  videoModal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2)
  },
  videoModalPaper: {
    outline: "none",
    width: "100%",
    maxWidth: 960,
    maxHeight: "92vh",
    overflow: "auto",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 1.5,
    boxShadow: theme.shadows[10],
    position: "relative"
  },
  modalClose: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 2,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
  },
  videoFrameWrap: {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%",
    backgroundColor: theme.palette.background.default
  },
  videoFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: 0
  },
  modalBody: {
    padding: theme.spacing(2.5, 3, 3)
  },
  modalTitle: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    paddingRight: theme.spacing(5)
  },
  modalCategory: {
    marginBottom: theme.spacing(1.5)
  },
  modalDescription: {
    color: theme.palette.text.secondary,
    whiteSpace: "pre-wrap"
  },
  modalFooter: {
    marginTop: theme.spacing(2),
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1)
  },
  skeletonCard: {
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper
  }
}));

function HelpsSkeleton({ classes }) {
  return (
    <Box className={classes.cardsGrid}>
      {[1, 2, 3, 4].map((key) => (
        <Box key={key} className={classes.skeletonCard}>
          <Skeleton variant="rect" height={158} />
          <Box p={2}>
            <Skeleton width="80%" />
            <Skeleton width="100%" />
            <Skeleton width="60%" height={32} style={{ marginTop: 12 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

const Helps = () => {
  const classes = useStyles();
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [selectedHelp, setSelectedHelp] = useState(null);
  const { list } = useHelps();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const helps = await list();
        setRecords(helps);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [list]);

  const filteredRecords = useMemo(
    () => filterHelps(records, { search, category: categoryFilter }),
    [records, search, categoryFilter]
  );

  const playbackList = useMemo(
    () => sortHelpsForPlayback(filteredRecords),
    [filteredRecords]
  );

  const { featured, categories } = useMemo(
    () => groupHelpsByCategory(filteredRecords),
    [filteredRecords]
  );

  const openVideoModal = useCallback((help) => {
    setSelectedHelp(help);
  }, []);

  const closeVideoModal = useCallback(() => {
    setSelectedHelp(null);
  }, []);

  useEffect(() => {
    const openHelpId = location.state?.openHelpId;
    if (!openHelpId || !records.length) {
      return;
    }
    const match = records.find((r) => r.id === openHelpId);
    if (match) {
      openVideoModal(match);
    }
  }, [location.state, records, openVideoModal]);

  const handleModalClose = useCallback(
    (event) => {
      if (event.key === "Escape") {
        closeVideoModal();
      }
    },
    [closeVideoModal]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleModalClose);
    return () => {
      document.removeEventListener("keydown", handleModalClose);
    };
  }, [handleModalClose]);

  const handleStartBasics = () => {
    const basics = findBasicsHelp(
      filterHelps(records, { category: "Atendimento" })
    );
    if (basics) {
      openVideoModal(basics);
    }
  };

  const currentIndex = selectedHelp
    ? playbackList.findIndex((h) => h.id === selectedHelp.id)
    : -1;
  const nextHelp =
    currentIndex >= 0 && currentIndex < playbackList.length - 1
      ? playbackList[currentIndex + 1]
      : null;

  const embedUrl = selectedHelp
    ? resolveHelpEmbedUrl(selectedHelp.video)
    : null;

  const categoryChips = [
    { value: FILTER_ALL, label: i18n.t("helps.filterAll") },
    ...HELP_CATEGORIES.map((cat) => ({ value: cat, label: cat }))
  ];

  const renderVideoModal = () => (
    <Modal
      open={Boolean(selectedHelp)}
      onClose={closeVideoModal}
      className={classes.videoModal}
    >
      <Paper className={classes.videoModalPaper} elevation={0}>
        <IconButton
          className={classes.modalClose}
          onClick={closeVideoModal}
          aria-label={i18n.t("helps.close")}
          size="small"
        >
          <CloseIcon />
        </IconButton>
        {embedUrl ? (
          <Box className={classes.videoFrameWrap}>
            <iframe
              className={classes.videoFrame}
              src={embedUrl}
              title={selectedHelp?.title || "YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        ) : null}
        {selectedHelp ? (
          <Box className={classes.modalBody}>
            <Typography variant="h5" className={classes.modalTitle}>
              {selectedHelp.title}
            </Typography>
            {selectedHelp.category ? (
              <Chip
                size="small"
                label={selectedHelp.category}
                className={classes.modalCategory}
              />
            ) : null}
            {selectedHelp.description ? (
              <Typography variant="body1" className={classes.modalDescription}>
                {selectedHelp.description}
              </Typography>
            ) : null}
            <Box className={classes.modalFooter}>
              {nextHelp ? (
                <Button
                  variant="outlined"
                  color="primary"
                  endIcon={<NavigateNextIcon />}
                  onClick={() => openVideoModal(nextHelp)}
                >
                  {i18n.t("helps.nextVideo")}
                </Button>
              ) : null}
              <Button variant="contained" color="primary" onClick={closeVideoModal}>
                {i18n.t("helps.close")}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Paper>
    </Modal>
  );

  const renderList = () => {
    if (loading) {
      return <HelpsSkeleton classes={classes} />;
    }

    if (!records.length) {
      return (
        <Paper className={classes.emptyState} elevation={0}>
          <Typography variant="body1">{i18n.t("helps.empty")}</Typography>
        </Paper>
      );
    }

    if (!filteredRecords.length) {
      return (
        <Paper className={classes.emptyState} elevation={0}>
          <Typography variant="body1">
            {i18n.t("helps.notFound")}
          </Typography>
        </Paper>
      );
    }

    return (
      <>
        {featured.length > 0 ? (
          <Box className={classes.section}>
            <Typography variant="h6" className={classes.sectionTitle}>
              <StarIcon color="primary" fontSize="small" />
              {i18n.t("helps.featured")}
            </Typography>
            <Box className={classes.featuredGrid}>
              {featured.map((record) => (
                <HelpVideoCard
                  key={`featured-${record.id}`}
                  record={record}
                  featured
                  showFeaturedBadge
                  onWatch={openVideoModal}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {categories.map(({ name, items }) => (
          <Box key={name} className={classes.section}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {name}
            </Typography>
            <Box className={classes.cardsGrid}>
              {items.map((record) => (
                <HelpVideoCard
                  key={record.id}
                  record={record}
                  onWatch={openVideoModal}
                />
              ))}
            </Box>
          </Box>
        ))}
      </>
    );
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("helps.trainingCenter")}</Title>
        <MainHeaderButtonsWrapper />
      </MainHeader>

      <Box className={classes.content}>
        <Paper className={classes.hero} elevation={0}>
          <Typography variant="h4" className={classes.heroTitle}>
            {i18n.t("helps.trainingCenter")}
          </Typography>
          <Typography variant="body1" className={classes.heroSubtitle}>
            {i18n.t("helps.heroSubtitle")}
          </Typography>
          <Box className={classes.heroActions}>
            <Typography className={classes.videoCount}>
              {i18n.t("helps.videoCount", { count: records.length })}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayCircleOutlineIcon />}
              onClick={handleStartBasics}
              disabled={loading || !records.length}
            >
              {i18n.t("helps.startBasics")}
            </Button>
          </Box>
        </Paper>

        <Box className={classes.toolbar}>
          <TextField
            className={classes.searchField}
            variant="outlined"
            size="small"
            placeholder={i18n.t("helps.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" style={{ marginRight: 8 }} />
            }}
          />
          <Box className={classes.chipsRow}>
            {categoryChips.map((chip) => (
              <Chip
                key={chip.value}
                label={chip.label}
                clickable
                color={categoryFilter === chip.value ? "primary" : "default"}
                variant={categoryFilter === chip.value ? "default" : "outlined"}
                className={classes.categoryChip}
                onClick={() => setCategoryFilter(chip.value)}
              />
            ))}
          </Box>
        </Box>

        {renderList()}
      </Box>

      {renderVideoModal()}
    </MainContainer>
  );
};

export default Helps;
