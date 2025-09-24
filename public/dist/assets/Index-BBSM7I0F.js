import { _ as _export_sfc, c as createElementBlock, o as openBlock, r as renderSlot, n as normalizeClass, a as createTextVNode, b as createBaseVNode, d as createVNode, w as withCtx } from "./index-B3MpCbwj.js";
const _sfc_main$1 = {
  __name: "button",
  props: {
    color: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["click"],
  setup(__props, { expose: __expose, emit: __emit }) {
    __expose();
    const props = __props;
    const emit = __emit;
    const handleClick = () => {
      if (props.disabled) return;
      emit("click");
    };
    const __returned__ = { props, emit, handleClick };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  }
};
const _hoisted_1 = ["disabled"];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("button", {
    class: normalizeClass(["transition-all duration-100 flex items-center justify-center box-border px-4 outline outline-1 outline-transparent rounded-md border-transparent h-12 text-sm font-semibold bg-blue-500 text-white cursor-pointer gap-2 relative", { "opacity-50": $props.disabled }]),
    style: { "overflow": "unset" },
    disabled: $props.disabled,
    onClick: $setup.handleClick
  }, [
    renderSlot(_ctx.$slots, "default")
  ], 10, _hoisted_1);
}
const Button = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__file", "C:/Code/tiangou-web-new/frontend/packages/global/components/button.vue"]]);
const Renderer = window.require && window.require("electron") || window.electron || {};
const ipc = Renderer.ipcRenderer || void 0;
const URLS = {
  test: "controller/example/test",
  getMessagePageList: "controller/chatMessage/getMessagePageList",
  addMessage: "controller/chatMessage/addMessage"
};
const apis = {};
for (const key in URLS) {
  const url = URLS[key];
  apis[key] = (data) => {
    return ipc.invoke(url, data);
  };
}
const _sfc_main = {
  __name: "Index",
  setup(__props, { expose: __expose }) {
    __expose();
    const test = () => {
      apis.test().then((res) => {
        console.log(res);
      });
    };
    const getMessagePageList = () => {
      apis.getMessagePageList({}).then((res) => {
        console.log(res);
      });
    };
    const addMessage = () => {
      apis.addMessage({
        nickname: "张三",
        content: "你好"
      }).then((res) => {
        console.log(res);
      });
    };
    const __returned__ = { test, getMessagePageList, addMessage, get Button() {
      return Button;
    }, get ipcApiRoute() {
      return apis;
    } };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", null, [
    _cache[3] || (_cache[3] = createTextVNode(
      " home ",
      -1
      /* CACHED */
    )),
    createBaseVNode("div", null, [
      createVNode($setup["Button"], { onClick: $setup.test }, {
        default: withCtx(() => [..._cache[0] || (_cache[0] = [
          createTextVNode(
            "按钮",
            -1
            /* CACHED */
          )
        ])]),
        _: 1
        /* STABLE */
      }),
      createVNode($setup["Button"], { onClick: $setup.getMessagePageList }, {
        default: withCtx(() => [..._cache[1] || (_cache[1] = [
          createTextVNode(
            "获取消息列表",
            -1
            /* CACHED */
          )
        ])]),
        _: 1
        /* STABLE */
      }),
      createVNode($setup["Button"], { onClick: $setup.addMessage }, {
        default: withCtx(() => [..._cache[2] || (_cache[2] = [
          createTextVNode(
            "添加消息",
            -1
            /* CACHED */
          )
        ])]),
        _: 1
        /* STABLE */
      })
    ])
  ]);
}
const Index = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "C:/Code/tiangou-web-new/frontend/packages/pc/src/views/Index.vue"]]);
export {
  Index as default
};
