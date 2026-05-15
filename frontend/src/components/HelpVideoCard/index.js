import React from "react";
import {
  makeStyles,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Tooltip
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StarIcon from "@material-ui/icons/Star";
import OndemandVideoIcon from "@material-ui/icons/OndemandVideo";
import { i18n } from "../../translate/i18n";
import {
  normalizeCategory,
  normalizeHelpRecord,
  resolveHelpThumbnailUrl
} from "../../utils/helpThumbnail";

const DESCRIPTION_CLAMP = 100;

const truncateDescription = (text) => {
  if (!text) {
    return "";
  }
  if (text.length <= DESCRIPTION_CLAMP) {
    return text;
  }
  return `${text.slice(0, DESCRIPTION_CLAMP).trim()}…`;
};

const useStyles = makeStyles((theme) => ({
  card: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 1.5,
    transition:
      "transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[6],
      backgroundColor: theme.palette.action.hover,
      "& $playOverlay": {
        opacity: 1
      },
      "& $playButton": {
        transform: "scale(1.08)"
      }
    }
  },
  cardFeatured: {
    minHeight: 360
  },
  thumbnailWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    backgroundColor: theme.palette.background.default,
    cursor: "pointer"
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      theme.palette.type === "dark"
        ? "rgba(0,0,0,0.45)"
        : "rgba(0,0,0,0.35)",
    opacity: 0.85,
    transition: "opacity 0.22s ease"
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: theme.shadows[4],
    transition: "transform 0.22s ease"
  },
  categoryBadge: {
    position: "absolute",
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 1,
    fontWeight: 600,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`
  },
  featuredRibbon: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: "0.7rem",
    fontWeight: 700,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  },
  cardBody: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: theme.spacing(1)
  },
  cardTitle: {
    fontWeight: 700,
    color: theme.palette.text.primary,
    lineHeight: 1.25
  },
  cardDescription: {
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flex: 1
  },
  watchButton: {
    alignSelf: "flex-start",
    marginTop: "auto",
    fontWeight: 600
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover
  }
}));

export default function HelpVideoCard({
  record,
  featured = false,
  showFeaturedBadge = false,
  onWatch,
  preview = false
}) {
  const classes = useStyles();
  const item = normalizeHelpRecord(record) || record;
  const thumb = resolveHelpThumbnailUrl(item);
  const shortDesc = truncateDescription(item.description);
  const hasLongDesc =
    item.description && item.description.length > DESCRIPTION_CLAMP;
  const category = normalizeCategory(item);

  const handleWatch = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    if (onWatch) {
      onWatch(item);
    }
  };

  return (
    <Paper
      className={`${classes.card} ${featured ? classes.cardFeatured : ""}`}
      elevation={0}
    >
      <Box
        className={classes.thumbnailWrap}
        onClick={preview ? undefined : handleWatch}
        role={preview ? undefined : "button"}
        tabIndex={preview ? undefined : 0}
        onKeyDown={
          preview
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleWatch(e);
                }
              }
        }
      >
        {category ? (
          <Chip
            size="small"
            label={category}
            className={classes.categoryBadge}
          />
        ) : null}
        {(showFeaturedBadge || item.isFeatured) && featured ? (
          <Box className={classes.featuredRibbon}>
            <StarIcon style={{ fontSize: 14 }} />
            {i18n.t("helps.featured")}
          </Box>
        ) : null}
        {thumb ? (
          <img src={thumb} alt="" className={classes.thumbnail} loading="lazy" />
        ) : (
          <Box className={classes.thumbnailPlaceholder}>
            <OndemandVideoIcon style={{ fontSize: 48, opacity: 0.5 }} />
          </Box>
        )}
        <Box className={classes.playOverlay}>
          <Box className={classes.playButton}>
            <PlayArrowIcon />
          </Box>
        </Box>
      </Box>
      <Box className={classes.cardBody}>
        <Typography
          variant={featured ? "h6" : "subtitle1"}
          className={classes.cardTitle}
        >
          {item.title || i18n.t("helps.previewUntitled")}
        </Typography>
        {shortDesc ? (
          hasLongDesc ? (
            <Tooltip title={item.description} arrow>
              <Typography variant="body2" className={classes.cardDescription}>
                {shortDesc}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" className={classes.cardDescription}>
              {shortDesc}
            </Typography>
          )
        ) : (
          <Typography variant="body2" className={classes.cardDescription}>
            {i18n.t("helps.previewNoDescription")}
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.watchButton}
          startIcon={<PlayArrowIcon />}
          onClick={handleWatch}
          disabled={preview && !item.video}
        >
          {i18n.t("helps.watch")}
        </Button>
      </Box>
    </Paper>
  );
}
