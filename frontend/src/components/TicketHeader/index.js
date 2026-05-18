import React from "react";

import { Card } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";
import { PANEL_RADIUS } from "../../theme/ticketPanelStyles";

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
			borderBottom: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
			borderTop: "none",
			borderTopRightRadius: PANEL_RADIUS,
			borderTopLeftRadius: PANEL_RADIUS,
			boxShadow: "none",
			overflow: "visible",
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
				<Card elevation={0} className={classes.ticketHeader}>
					{children}
				</Card>
			)}
		</>
	);
};

export default TicketHeader;
