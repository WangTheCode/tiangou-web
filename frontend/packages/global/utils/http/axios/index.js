import axios from "axios";
// import { notification } from 'ant-design-vue'
import Cache from "../../cache";
import { useUserStore } from "../../../stores/counter";
// import { showNotify } from "vant";

//请求超时时间
axios.defaults.timeout = 30000;

let token = "";

//请求地址
let baseURL = import.meta.env.VITE_HTTP_URL; 
 
const axiosInstance = axios.create({
  baseURL: baseURL,
});

// axios实例拦截请求
axiosInstance.interceptors.request.use(
  (config) => {
    // 请求头添加token
    if (!token) {
      const userToken = Cache.get("USER_TOKEN");
      if (userToken) {
        token = userToken;
      }
    }
    config.headers["Authorization"] = token;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// axios实例拦截响应
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  // 请求失败
  (error) => {
    if (error.status === 401) {
      //登录
      const userStore = useUserStore();
      userStore.setUserInfo({});
      userStore.noticeLogin();
      // router.push('/login')
    } else {
      //提示错误
      // const status = error.response ? error.response.status : '提示'
      let message = "";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message = error.response.data.message;
      }
      // showNotify({
      //   message: message,
      //   type: "danger",
      // });
    }
    return Promise.reject(error);
  },
);

const request = (config) => {
  const conf = config;
  return new Promise((resolve, reject) => {
    axiosInstance
      .request(conf)
      .then((res) => {
        const { data } = res;
        // 请求响应体中code不为200时，则认为请求失败
        // if (data.code != 0) {
        //   const err = res;
        //   err.response = {
        //     data: data,
        //   };
        //   if (data.message) {
        //     // showNotify({
        //     //   message: data.message,
        //     //   type: "danger",
        //     // });
        //   }
        //   reject(err);
        //   return;
        // }
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export function get(config) {
  return request({ ...config, method: "GET" });
}

export function post(config) {
  return request({ ...config, method: "POST" });
}

export default request;
