import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Card, CardHeader } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";

import { PANEL_RADIUS } from "../../theme/ticketPanelStyles";

const useStyles = makeStyles((theme) => ({
	ticketHeader: {
		display: "flex",
		backgroundColor: theme.palette.background.paper,
		flex: "none",
		borderBottom: `1px solid ${theme.palette.divider}`,
		borderTopRightRadius: PANEL_RADIUS,
		borderTopLeftRadius: PANEL_RADIUS,
		overflow: "visible",
	},
}));

const TicketHeaderSkeleton = () => {
	const classes = useStyles();

	return (
		<Card elevation={0} className={classes.ticketHeader}>
			<CardHeader
				titleTypographyProps={{ noWrap: true }}
				subheaderTypographyProps={{ noWrap: true }}
				avatar={
					<Skeleton animation="wave" variant="circle">
						<Avatar alt="contact_image" />
					</Skeleton>
				}
				title={<Skeleton animation="wave" width={80} />}
				subheader={<Skeleton animation="wave" width={140} />}
			/>
		</Card>
	);
};

export default TicketHeaderSkeleton;
