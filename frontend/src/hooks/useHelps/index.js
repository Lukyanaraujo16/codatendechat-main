import { useCallback } from "react";
import api from "../../services/api";
import { parseHelpsList } from "../../utils/helpThumbnail";

const useHelps = () => {
  const findAll = useCallback(async (params) => {
    const { data } = await api.request({
      url: `/helps`,
      method: "GET",
      params
    });
    return data;
  }, []);

  const list = useCallback(async (params) => {
    const { data } = await api.request({
      url: "/helps/list",
      method: "GET",
      params
    });
    return parseHelpsList(data);
  }, []);

  const save = useCallback(async (payload) => {
    const { data: responseData } = await api.request({
      url: "/helps",
      method: "POST",
      data: payload
    });
    return responseData;
  }, []);

  const update = useCallback(async (payload) => {
    const { data: responseData } = await api.request({
      url: `/helps/${payload.id}`,
      method: "PUT",
      data: payload
    });
    return responseData;
  }, []);

  const remove = useCallback(async (id) => {
    const { data } = await api.request({
      url: `/helps/${id}`,
      method: "DELETE"
    });
    return data;
  }, []);

  const uploadThumbnail = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("typeArch", "helps");

    const { data } = await api.request({
      url: "/helps/thumbnail-upload",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  }, []);

  return {
    findAll,
    list,
    save,
    update,
    remove,
    uploadThumbnail
  };
};

export default useHelps;
