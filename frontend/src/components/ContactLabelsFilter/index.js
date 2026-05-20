import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { getLabelChipTextColor } from "../../utils/getLabelChipTextColor";

export function ContactLabelsFilter({ onFiltered }) {
  const [labels, setLabels] = useState([]);
  const [selecteds, setSelecteds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get("/contact-labels");
        setLabels(Array.isArray(data) ? data : []);
      } catch (err) {
        toastError(err);
      }
    }
    fetchData();
  }, []);

  const onChange = (value) => {
    setSelecteds(value);
    onFiltered(value);
  };

  return (
    <Box style={{ padding: 10 }}>
      <Autocomplete
        multiple
        size="small"
        options={labels}
        value={selecteds}
        onChange={(e, v) => onChange(v)}
        getOptionLabel={(option) => option.name}
        renderTags={(value, getTagProps) =>
          (Array.isArray(value) ? value : []).map((option, index) => (
            <Chip
              variant="outlined"
              style={{
                backgroundColor: option.color || "#eee",
                color: getLabelChipTextColor(option.color),
                fontWeight: 600,
                borderRadius: 999,
              }}
              label={option.name}
              {...getTagProps({ index })}
              size="small"
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={i18n.t("contactLabels.filter.placeholder")}
          />
        )}
      />
    </Box>
  );
}

ContactLabelsFilter.propTypes = {
  onFiltered: PropTypes.func.isRequired,
};
