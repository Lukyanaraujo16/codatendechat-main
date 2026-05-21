import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";

const filterOptions = createFilterOptions({
	trim: true,
});

const TransferTicketModal = ({ modalOpen, onClose, ticketid }) => {
	const history = useHistory();
	const [options, setOptions] = useState([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [searchDraft, setSearchDraft] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);
	const searchInputRef = useRef(null);

	useEffect(() => {
		if (!modalOpen) return;
		const id = requestAnimationFrame(() => {
			if (searchInputRef.current) {
				searchInputRef.current.focus();
			}
		});
		return () => cancelAnimationFrame(id);
	}, [modalOpen]);

	useEffect(() => {
		if (!modalOpen) return undefined;
		const t = setTimeout(() => setSearchQuery(searchDraft), 300);
		return () => clearTimeout(t);
	}, [searchDraft, modalOpen]);

	useEffect(() => {
		if (!modalOpen) {
			setUsersLoading(false);
			return undefined;
		}

		const trimmed = searchQuery.trim();
		if (trimmed.length < 3) {
			setUsersLoading(false);
			setOptions([]);
			return undefined;
		}

		let cancelled = false;
		setUsersLoading(true);

		const fetchUsers = async () => {
			try {
				const { data } = await api.get("/users/", {
					params: { searchParam: trimmed },
				});
				if (!cancelled) {
					setOptions(Array.isArray(data.users) ? data.users : []);
				}
			} catch (err) {
				if (!cancelled) toastError(err);
			} finally {
				if (!cancelled) setUsersLoading(false);
			}
		};

		fetchUsers();

		return () => {
			cancelled = true;
		};
	}, [searchQuery, modalOpen]);

	const handleClose = () => {
		onClose();
		setSearchDraft("");
		setSearchQuery("");
		setSelectedUser(null);
	};

	const mergeInputRef = useCallback((params, node) => {
		searchInputRef.current = node;
		const ref = params.inputRef;
		if (typeof ref === "function") {
			ref(node);
		} else if (ref && typeof ref === "object") {
			ref.current = node;
		}
	}, []);

	const handleSaveTicket = async e => {
		e.preventDefault();
		if (!ticketid || !selectedUser) return;
		setSaving(true);
		try {
			await api.put(`/tickets/${ticketid}`, {
				userId: selectedUser.id,
				queueId: null,
				status: "open",
			});
			setSaving(false);
			history.push(`/tickets`);
		} catch (err) {
			setSaving(false);
			toastError(err);
		}
	};

	return (
		<Dialog
			open={modalOpen}
			onClose={handleClose}
			maxWidth="lg"
			scroll="paper"
			disableEnforceFocus
			disableAutoFocus
			disableRestoreFocus
		>
			<form onSubmit={handleSaveTicket}>
				<DialogTitle id="form-dialog-title">
					{i18n.t("transferTicketModal.title")}
				</DialogTitle>
				<DialogContent dividers>
					<Autocomplete
						style={{ width: 300 }}
						value={selectedUser}
						inputValue={searchDraft}
						onInputChange={(_event, newInputValue, reason) => {
							if (reason === "reset") return;
							setSearchDraft(newInputValue);
						}}
						getOptionLabel={option =>
							typeof option === "string" ? option : `${option.name || ""}`
						}
						onChange={(_e, newValue) => {
							if (newValue && typeof newValue === "object") {
								setSelectedUser(newValue);
								setSearchDraft(newValue.name || "");
							} else {
								setSelectedUser(null);
							}
						}}
						options={options}
						filterOptions={filterOptions}
						freeSolo
						autoHighlight
						noOptionsText={i18n.t("transferTicketModal.noOptions")}
						loading={usersLoading}
						renderInput={params => (
							<TextField
								{...params}
								label={i18n.t("transferTicketModal.fieldLabel")}
								variant="outlined"
								required
								inputRef={node => mergeInputRef(params, node)}
								onClick={e => e.stopPropagation()}
								onMouseDown={e => e.stopPropagation()}
								onKeyDown={e => e.stopPropagation()}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<React.Fragment>
											{usersLoading ? (
												<CircularProgress color="inherit" size={20} />
											) : null}
											{params.InputProps.endAdornment}
										</React.Fragment>
									),
								}}
							/>
						)}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleClose}
						color="secondary"
						disabled={saving}
						variant="outlined"
					>
						{i18n.t("transferTicketModal.buttons.cancel")}
					</Button>
					<ButtonWithSpinner
						variant="contained"
						type="submit"
						color="primary"
						loading={saving}
					>
						{i18n.t("transferTicketModal.buttons.ok")}
					</ButtonWithSpinner>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default TransferTicketModal;
