"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[7947],{3905:(e,t,n)=>{n.d(t,{Zo:()=>g,kt:()=>m});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),s=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},g=function(e){var t=s(e.components);return r.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},p=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,g=i(e,["components","mdxType","originalType","parentName"]),p=s(n),m=a,d=p["".concat(l,".").concat(m)]||p[m]||u[m]||o;return n?r.createElement(d,c(c({ref:t},g),{},{components:n})):r.createElement(d,c({ref:t},g))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,c=new Array(o);c[0]=p;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,c[1]=i;for(var s=2;s<o;s++)c[s]=n[s];return r.createElement.apply(null,c)}return r.createElement.apply(null,n)}p.displayName="MDXCreateElement"},1552:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>c,default:()=>g,frontMatter:()=>o,metadata:()=>i,toc:()=>l});var r=n(7462),a=(n(7294),n(3905));const o={sidebar_label:"agent",title:"autogen.agent.agent"},c=void 0,i={unversionedId:"reference/autogen/agent/agent",id:"reference/autogen/agent/agent",isDocsHomePage:!1,title:"autogen.agent.agent",description:"Agent Objects",source:"@site/docs/reference/autogen/agent/agent.md",sourceDirName:"reference/autogen/agent",slug:"/reference/autogen/agent/agent",permalink:"/FLAML/docs/reference/autogen/agent/agent",editUrl:"https://github.com/microsoft/FLAML/edit/main/website/docs/reference/autogen/agent/agent.md",tags:[],version:"current",frontMatter:{sidebar_label:"agent",title:"autogen.agent.agent"},sidebar:"referenceSideBar",next:{title:"coding_agent",permalink:"/FLAML/docs/reference/autogen/agent/coding_agent"}},l=[{value:"Agent Objects",id:"agent-objects",children:[{value:"name",id:"name",children:[],level:4},{value:"receive",id:"receive",children:[],level:4}],level:2}],s={toc:l};function g(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,r.Z)({},s,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h2",{id:"agent-objects"},"Agent Objects"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-python"},"class Agent()\n")),(0,a.kt)("p",null,"An abstract class for AI agent.\nAn agent can communicate with other agents, human and perform actions.\nDifferent agents can differ in how and who they communicate with, and what actions they can perform. For example, an autonomous agent can communicate with human and other agents, and perform actions by creating agents and sending messages to other agents. A planning agent can communicate with other agents to make a plan and keep track of tasks. An execution agent can only communicate with other agents, and perform actions such as executing a command or code."),(0,a.kt)("h4",{id:"name"},"name"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-python"},"@property\ndef name()\n")),(0,a.kt)("p",null,"Get the name of the agent."),(0,a.kt)("h4",{id:"receive"},"receive"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-python"},"def receive(message, sender)\n")),(0,a.kt)("p",null,"Receive a message from another agent.\nThis method is called by the sender.\nIt needs to be overriden by the subclass to perform followup actions."))}g.isMDXComponent=!0}}]);