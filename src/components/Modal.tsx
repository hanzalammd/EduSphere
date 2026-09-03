import {ReactNode} from 'react';
export default function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:ReactNode}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>×</button></div>{children}</div></div>}
