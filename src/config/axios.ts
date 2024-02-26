import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const createAxiosInstance = (config: AxiosRequestConfig): AxiosInstance => {
  return axios.create(config);
};

export default createAxiosInstance;
