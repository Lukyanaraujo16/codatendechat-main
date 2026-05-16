import { Chip, Paper, TextField } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { isArray, isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(0.75, 1.5),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: "none",
    },
    input: {
        "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            minHeight: 36,
            fontSize: "0.875rem",
            backgroundColor: alpha(
                theme.palette.action.hover,
                theme.palette.type === "dark" ? 0.35 : 0.5
            ),
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
        },
    },
    chip: {
        fontWeight: 600,
        borderRadius: 999,
        fontSize: "0.68rem",
        height: 22,
        marginRight: 4,
    },
}));

export function TagsContainer({ ticket }) {
    const classes = useStyles();
    const [tags, setTags] = useState([]);
    const [selecteds, setSelecteds] = useState([]);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    useEffect(() => {
        if (isMounted.current) {
            loadTags().then(() => {
                if (Array.isArray(ticket?.tags)) {
                    setSelecteds(ticket.tags);
                } else {
                    setSelecteds([]);
                }
            });
        }
    }, [ticket]);

    const createTag = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const loadTags = async () => {
        try {
            const { data } = await api.get(`/tags/list`);
            setTags(Array.isArray(data) ? data : (data?.tags || []));
        } catch (err) {
            toastError(err);
        }
    }

    const syncTags = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags/sync`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const onChange = async (value, reason) => {
        let optionsChanged = []
        if (reason === 'create-option') {
            if (isArray(value)) {
                for (let item of value) {
                    if (isString(item)) {
                        const newTag = await createTag({ name: item })
                        optionsChanged.push(newTag);
                    } else {
                        optionsChanged.push(item);
                    }
                }
            }
            await loadTags();
        } else {
            optionsChanged = value;
        }
        setSelecteds(Array.isArray(optionsChanged) ? optionsChanged : []);
        if (ticket?.id) {
          await syncTags({ ticketId: ticket.id, tags: Array.isArray(optionsChanged) ? optionsChanged : [] });
        }
    }

    return (
        <Paper elevation={0} square className={classes.root}>
            <Autocomplete
                multiple
                size="small"
                options={Array.isArray(tags) ? tags : []}
                value={Array.isArray(selecteds) ? selecteds : []}
                freeSolo
                onChange={(e, v, r) => onChange(v, r)}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name) || ''}
                renderTags={(value, getTagProps) =>
                    (Array.isArray(value) ? value : []).map((option, index) => (
                        <Chip
                            variant="outlined"
                            className={classes.chip}
                            style={{
                                background: option.color || undefined,
                                color: option.color ? "#FFF" : undefined,
                                borderColor: option.color ? "transparent" : undefined,
                            }}
                            label={(typeof option === 'string' ? option : option?.name || '').toUpperCase()}
                            {...getTagProps({ index })}
                            size="small"
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Tags"
                        className={classes.input}
                    />
                )}
                PaperComponent={({ children }) => (
                    <Paper style={{ width: 400, marginLeft: 12 }}>
                        {children}
                    </Paper>
                )}
            />
        </Paper>
    )
}