import {LanguageSwitch} from './LanguageSwitch.mjs';
import {ui,uiFeedback,useUiLocale} from '../shared/ui-locale.mjs';
import React, {useRef, useState} from 'react';
import {ArrowRight, FolderOpen, Plus, Unplug} from 'lucide-react';
import './workbench-home.css';

type Connection = {
  connected: boolean;
  nativeConfiguration?: boolean;
  service: 'BytePlus';
  imageModel: string;
  videoModel: string;
};
export type WorkbenchHomeProps = {
  workspace: any;
  connection: Connection;
  busy: boolean;
  onOpenProject: (id: string) => void;
  onCreateProject: (name: string) => Promise<any>;
  onConnect: () => void;
  onCloseConnection: () => void;
  onSettings?: () => void;
};

export function WorkbenchHome({workspace, connection, busy, onOpenProject, onCreateProject, onConnect, onCloseConnection,onSettings}: WorkbenchHomeProps) {useUiLocale(React);
  const projects: any[] = Array.isArray(workspace?.projects) ? workspace.projects : [];
  const tasks: any[] | null = Array.isArray(workspace?.tasks) ? workspace.tasks : null;
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const createLock = useRef(false);
  const locked = busy || creating;
  const configured = connection?.connected === true;

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || createLock.current) return;
    const value = name.trim();
    if (!value) {
      setError('請填寫項目名稱。');
      return;
    }
    createLock.current = true;
    setCreating(true);
    setError('');
    try {
      const result = await onCreateProject(value);
      if (!result || result.ok === false) {
        setError('項目尚未建立，請查看提示後重試。');
        return;
      }
      // The shared command callback opens the canvas only after success.
      setName('');
    } catch {
      setError('未能建立項目，請保留名稱並重試。');
    } finally {
      createLock.current = false;
      setCreating(false);
    }
  }

  return <div className="workbench-home">
    <header className="workbench-home__header">
      <div className="workbench-home__brand"><span aria-hidden="true">A</span><div><b>{ui("AICG 工作台")}</b><small>{ui("素材、任務與畫布，同一個項目")}</small></div></div>
      <button type="button" onClick={onSettings}>{ui("工作台設定")}</button>
    </header>
    <main className="workbench-home__main" aria-labelledby="workbench-home-title">
      <section className="workbench-home__intro">
        <h1 id="workbench-home-title">{ui("從項目進入創作畫布")}</h1>
        <p>{ui("匯入素材、生成圖片與影片，再在畫布內合併成片。內容修改後，請手動保存。")}</p>
      </section>

      <div className="workbench-home__setup">
        <section className="workbench-home__new-project" aria-labelledby="workbench-new-project-title">
          <h2 id="workbench-new-project-title">{ui("新建項目")}</h2>
          <form onSubmit={createProject} aria-busy={creating}>
            <label htmlFor="workbench-project-name">{ui("項目名稱")}</label>
            <input id="workbench-project-name" name="projectName" value={name} maxLength={160} disabled={locked} autoComplete="off" aria-describedby={'workbench-project-hint' + (error ? ' workbench-project-error' : '')} aria-invalid={error ? true : undefined} onChange={event => {setName(event.target.value); if (error) setError('');}}/>
            <p id="workbench-project-hint" className="workbench-home__hint">{ui("建立成功後，直接進入這個項目的畫布。")}</p>
            <button type="submit" className="primary" disabled={locked || !name.trim()}><Plus size={16} aria-hidden="true"/>{creating ? ui("建立中…") : ui("建立項目並開啟畫布")}</button>
            {error && <div id="workbench-project-error" className="workbench-home__error" role="alert">{uiFeedback(React,error,true)}</div>}
          </form>
        </section>
        <section className="workbench-home__connection" aria-labelledby="workbench-connection-title">
          <div className="workbench-home__section-heading"><h2 id="workbench-connection-title">{ui("生成服务")}</h2><span className={'workbench-home__connection-state' + (configured ? ' is-configured' : '')} role="status">{configured ? ui("本機連接已設定") : ui("尚未連接")}</span></div>
          <dl className="workbench-home__models"><div><dt>{ui("圖片模型")}</dt><dd>{(connection?.imageModel||ui("待設定"))}</dd></div><div><dt>{ui("影片模型")}</dt><dd>{(connection?.videoModel||ui("待設定"))}</dd></div></dl>
          <div className="workbench-home__actions">
            <button type="button" disabled={locked} data-byteplus-connect="true" onClick={onConnect}>{configured ? ui("更新 BytePlus 連接") : ui("連接 BytePlus")}</button>
            {configured && !connection.nativeConfiguration && <button type="button" disabled={locked} data-byteplus-clear="true" onClick={onCloseConnection}><Unplug size={16} aria-hidden="true"/>{ui("清除本次連接")}</button>}
          </div>
          <p className="workbench-home__hint">{ui("可先打开项目。需要生成时，再设置模型连接。")}</p>
        </section>

      </div>

      <section className="workbench-home__projects" aria-labelledby="workbench-projects-title">
        <div className="workbench-home__section-heading"><h2 id="workbench-projects-title">{ui("你的項目")}</h2><span className="workbench-home__hint">{projects.length} {" "+ui("個項目")}</span></div>
        {projects.length ? <div className="workbench-home__project-grid">{projects.map(project => {
          const title = typeof project.name === 'string' && project.name.trim() ? project.name : ui('未命名項目');
          const count = tasks?.filter(task => task.projectId === project.id).length;
          return <button type="button" className="workbench-home__project-card" key={project.id} disabled={locked} onClick={() => onOpenProject(project.id)} aria-label={(ui("開啟項目：")+title)}>
            <span className="workbench-home__project-icon" aria-hidden="true"><FolderOpen size={24}/></span>
            <span className="workbench-home__project-copy"><strong>{title}</strong><span>{(project.description||ui("素材、任務與成片，在同一張畫布接續。"))}</span><small>{count !== undefined ? (count+" "+ui("個任務 ·")+" ") : ''}{ui("開啟畫布")}</small></span>
            <ArrowRight className="workbench-home__project-arrow" size={18} aria-hidden="true"/>
          </button>;
        })}</div> : <div className="workbench-home__empty"><FolderOpen size={28} aria-hidden="true"/><div><h3>{ui("先為這次創作建立一個項目")}</h3><p>{ui("在上方填寫名稱，就能開始整理素材與畫布。")}</p></div></div>}
      </section>
      <p className="workbench-home__footer">{ui("創作與合併都在畫布內完成。成片落盤與項目保存分開；請在離開前手動保存需要保留的修改。")}</p>
    </main>
  </div>;
}

export default WorkbenchHome;
