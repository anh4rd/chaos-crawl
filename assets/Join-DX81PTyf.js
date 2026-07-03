import{a as e,i as t,n,t as r}from"./index-sfFqzGgE.js";import{n as i,t as a}from"./Button-DcpHbD9V.js";import{c as o,i as s,t as c}from"./demoData-B7_3TIny.js";import{n as l,r as u}from"./playerSession-6sn5rjSf.js";var d=e(t(),1),f=r();function p({children:e}){return(0,f.jsx)(`main`,{className:`
        mx-auto
        min-h-screen
        max-w-md
        px-6
        py-8
      `,children:e})}function m({emoji:e,name:t,colour:n,selected:r=!1,onClick:i}){return(0,f.jsxs)(`button`,{onClick:i,className:`
        relative
        w-full
        overflow-hidden
        rounded-3xl
        border
        p-5
        text-left
        transition-all
        duration-200
        ${r?`border-yellow-400 scale-[1.02]`:`border-zinc-800 hover:border-zinc-600`}
      `,children:[(0,f.jsx)(`div`,{className:`absolute inset-y-0 left-0 w-2`,style:{background:n}}),(0,f.jsxs)(`div`,{className:`ml-4 flex items-center gap-4`,children:[(0,f.jsx)(`span`,{className:`text-4xl`,children:e}),(0,f.jsxs)(`div`,{children:[(0,f.jsx)(`h3`,{className:`text-xl font-bold`,children:t}),(0,f.jsx)(`p`,{className:`text-sm text-zinc-400`,children:`Join this team`})]})]})]})}function h(){let e=n();(0,d.useEffect)(()=>{l()&&e(`/game`)},[]);let[t,r]=(0,d.useState)(``),[h,g]=(0,d.useState)(null);return(0,f.jsx)(p,{children:(0,f.jsxs)(`div`,{className:`space-y-8`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(`img`,{src:`/chaos-crawl/Title.png`,alt:`Anna's Chaos Crawl`,loading:`lazy`,className:`mx-auto aspect-ratio:auto mb-4 w-fill`}),(0,f.jsx)(`p`,{className:`mt-2 text-zinc-400`})]}),(0,f.jsx)(`p`,{className:`mt-2 text-zinc-400`,children:`.`})]}),(0,f.jsx)(i,{children:(0,f.jsxs)(`div`,{className:`space-y-6`,children:[(0,f.jsx)(o,{value:t,onChange:e=>r(e.target.value),placeholder:`Your name`}),(0,f.jsx)(`div`,{className:`space-y-4`,children:c.map(e=>(0,f.jsx)(m,{emoji:e.emoji,name:e.name,colour:e.colour,selected:h===e.id,onClick:()=>g(e.id)},e.id))}),(0,f.jsx)(a,{type:`button`,onClick:async()=>{if(!t.trim()){alert(`Please enter your name.`);return}if(!h){alert(`Please select a team.`);return}let n=await s(t,h);if(n.error){alert(n.error.message);return}u(n.data.id),alert(`Let's fckn go!`),e(`/game`)},children:`Join Game`})]})})]})})}export{h as default};