import React from "react";
import { Chip, Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
    maxWidth: 220,
  },
  empty: {
    fontSize: "0.8rem",
    color: theme.palette.text.secondary,
  },
}));

export default function ContactAssigneesChips({ assignments = [] }) {
  const classes = useStyles();
  const users = (assignments || [])
    .map((a) => a?.user)
    .filter(Boolean);

  if (!users.length) {
    return (
      <Typography className={classes.empty} variant="caption">
        —
      </Typography>
    );
  }

  return (
    <div className={classes.wrap}>
      {users.map((u) => (
        <Chip
          key={u.id}
          size="small"
          label={u.name || u.email}
          variant="outlined"
        />
      ))}
    </div>
  );
}
