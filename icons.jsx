/* icons.jsx — clean line icons, stroke uses currentColor */
const Ic = ({ d, size = 20, fill = "none", sw = 1.8, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IconSparkle = (p) => (
  <Ic {...p} fill="currentColor" sw="0">
    <path d="M12 2.2l1.7 4.6a4 4 0 0 0 2.4 2.4l4.6 1.7-4.6 1.7a4 4 0 0 0-2.4 2.4L12 19.6l-1.7-4.6a4 4 0 0 0-2.4-2.4L3.3 10.9l4.6-1.7a4 4 0 0 0 2.4-2.4z"/>
    <path d="M19 3.2l.7 1.9a1.6 1.6 0 0 0 1 1l1.9.7-1.9.7a1.6 1.6 0 0 0-1 1L19 11.4l-.7-1.9a1.6 1.6 0 0 0-1-1L15.4 7.8l1.9-.7a1.6 1.6 0 0 0 1-1z" opacity=".85"/>
  </Ic>
);
const IconMic = (p) => (
  <Ic {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></Ic>
);
const IconSliders = (p) => (
  <Ic {...p}><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="17" r="2"/></Ic>
);
const IconMenu = (p) => (<Ic {...p}><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/></Ic>);
const IconSearch = (p) => (<Ic {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></Ic>);
const IconHeart = (p) => (<Ic {...p}><path d="M12 20s-7-4.4-9.3-8.6C1 7.8 3 4.8 6.2 4.8c2 0 3.2 1.1 3.8 2.1.6-1 1.8-2.1 3.8-2.1 3.2 0 5.2 3 3.5 6.6C19 15.6 12 20 12 20z"/></Ic>);
const IconHeartFill = (p) => (<Ic {...p} fill="currentColor" sw="0"><path d="M12 20.4s-7.3-4.6-9.7-9C.4 7.5 2.6 4.2 6.2 4.2c2.1 0 3.5 1.2 4.1 2.2.6-1 2-2.2 4.1-2.2 3.6 0 5.8 3.3 3.9 7.2-2.4 4.4-9.6 9-9.6 9z"/></Ic>);
const IconPlus = (p) => (<Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>);
const IconImage = (p) => (<Ic {...p}><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="10" r="1.8"/><path d="m4 17 4.5-4 3.5 3 3-2.5 6 5"/></Ic>);
const IconClose = (p) => (<Ic {...p}><path d="M6 6l12 12M18 6 6 18"/></Ic>);
const IconCompass = (p) => (<Ic {...p}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></Ic>);
const IconBookmark = (p) => (<Ic {...p}><path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-3.6L5 20V5.5a1 1 0 0 1 1-1z"/></Ic>);
const IconGrid = (p) => (<Ic {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></Ic>);
const IconChevR = (p) => (<Ic {...p}><path d="m9 5 7 7-7 7"/></Ic>);
const IconArrowL = (p) => (<Ic {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Ic>);
const IconSun = (p) => (<Ic {...p}><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></Ic>);
const IconMoon = (p) => (<Ic {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></Ic>);
const IconCheck = (p) => (<Ic {...p}><path d="m5 12.5 4.5 4.5L19 7"/></Ic>);
const IconTrash = (p) => (<Ic {...p}><path d="M4 6.5h16M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5M10 10.5v6M14 10.5v6"/></Ic>);
const IconUser = (p) => (<Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></Ic>);
const IconShare = (p) => (<Ic {...p}><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.1 10.9 7.8-3.8M8.1 13.1l7.8 3.8"/></Ic>);
const IconFlame = (p) => (<Ic {...p}><path d="M12 3s4 3.5 4 8a4 4 0 0 1-8 0c0-1 .4-2 1-2.6C8.5 9 9 12 9 12s-3 .5-3 4a6 6 0 0 0 12 0c0-4.5-3-7-3-7"/></Ic>);
const IconLayers = (p) => (<Ic {...p}><path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" opacity="1"/></Ic>);
const IconClock = (p) => (<Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></Ic>);
const IconDots = (p) => (<Ic {...p} fill="currentColor" sw="0"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></Ic>);
const IconWave = (p) => (<Ic {...p}><path d="M3 12h2M7 12c0-3 .8-6 2-6s2 9 2 9 .8-9 2-9 2 9 2 9 .8-6 2-6h4"/></Ic>);

Object.assign(window, {
  IconSparkle, IconMic, IconSliders, IconMenu, IconSearch, IconHeart, IconHeartFill,
  IconPlus, IconImage, IconClose, IconCompass, IconBookmark, IconGrid, IconChevR,
  IconArrowL, IconSun, IconMoon, IconCheck, IconTrash, IconUser, IconShare, IconFlame,
  IconLayers, IconClock, IconDots, IconWave,
});
