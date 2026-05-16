import React from "react";

import { Card } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";

const useStyles = makeStyles((theme) => {
	const isDark = theme.palette.type === "dark";
	return {
		ticketHeader: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			flexWrap: "nowrap",
			background: isDark
				? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${theme.palette.background.paper})`
				: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)}, ${theme.palette.background.paper})`,
			flex: "none",
			minHeight: 56,
			padding: theme.spacing(0, 0.5, 0, 0),
			borderBottom: `1px solid ${theme.palette.divider}`,
			borderTop: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
			boxShadow: isDark ? "none" : `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`,
			[theme.breakpoints.down("sm")]: {
				flexWrap: "wrap",
			},
		},
	};
});


const TicketHeader = ({ loading, children }) => {
	const classes = useStyles();

	return (
		<>
			{loading ? (
				<TicketHeaderSkeleton />
			) : (
				<Card square className={classes.ticketHeader}>
					{children}
				</Card>
			)}
		</>
	);
};

export default TicketHeader;
