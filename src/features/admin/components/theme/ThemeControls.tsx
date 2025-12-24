import { Layers, Move, Palette, Sun, type LucideIcon } from 'lucide-react';
import type { ElementStyle, ThemeLayout } from '../../../../types';

interface Props {
  activeControl: string;
  setActiveControl: (val: string) => void;
  layout: ThemeLayout;
  setLayout: React.Dispatch<React.SetStateAction<ThemeLayout>>;
  themeName: string;
  setThemeName: (val: string) => void;
  primaryColor: string;
  setPrimaryColor: (val: string) => void;
  handleImageUpload: (e: any) => void;
  loading: boolean;
}

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon, title: string }) => (
    <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#94a3b8', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase', marginTop:'20px', marginBottom:'10px', borderBottom:'1px solid #334155', paddingBottom:'5px'}}>
        <Icon size={14}/> {title}
    </div>
);

const ControlRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'0.8rem', color:'#cbd5e1', marginBottom:'4px'}}>{label}</div>
        {children}
    </div>
);

export default function ThemeControls({ 
  activeControl, setActiveControl, layout, setLayout, 
  themeName, setThemeName, primaryColor, setPrimaryColor, 
  handleImageUpload, loading 
}: Props) {

  const updateElement = (key: string, field: string, value: any) => {
      setLayout(prev => {
          // @ts-ignore
          const target = prev[key];
          if (!target) return prev;
          return { ...prev, [key]: { ...target, [field]: value } };
      });
  };

  const renderControls = () => {
      if (activeControl === 'banner') {
          return (
             <>
                <SectionHeader icon={Palette} title="Global Styles" />
                <ControlRow label="Theme Name"><input className="dark-input" value={themeName} onChange={e=>setThemeName(e.target.value)} /></ControlRow>
                <ControlRow label="Primary Color"><input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} style={{width:'100%', height:'40px', cursor:'pointer'}}/></ControlRow>
                <ControlRow label="Background Image"><input type="file" onChange={handleImageUpload} style={{color:'white', fontSize:'0.8rem'}} />{loading && <span style={{color:'#4da6a9', fontSize:'0.8rem'}}>Uploading...</span>}</ControlRow>
                
                <SectionHeader icon={Layers} title="Layout" />
                <ControlRow label={`Banner Height: ${layout.bannerHeight}%`}><input type="range" className="dark-range" min="0" max="100" value={layout.bannerHeight} onChange={e=>setLayout(p=>({...p, bannerHeight: parseInt(e.target.value)}))} /></ControlRow>
             </>
          );
      }

      // @ts-ignore
      const el = layout[activeControl] as ElementStyle;
      if (!el) return null;

      return (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', background:'#334155', padding:'10px', borderRadius:'8px'}}><span style={{fontWeight:'bold', color:'white', textTransform:'capitalize'}}>{activeControl.replace(/([A-Z])/g, ' $1').trim()}</span><label style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem', color:'white'}}><input type="checkbox" checked={el.visible} onChange={e=>updateElement(activeControl, 'visible', e.target.checked)} /> Visible</label></div>
            <SectionHeader icon={Move} title="Position & Size" />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Top %"><input type="number" className="dark-input" value={el.top} onChange={e=>updateElement(activeControl, 'top', parseInt(e.target.value))} /></ControlRow><ControlRow label="Left %"><input type="number" className="dark-input" value={el.left} onChange={e=>updateElement(activeControl, 'left', parseInt(e.target.value))} /></ControlRow></div>
            <ControlRow label={`Scale: ${el.scale}x`}><input type="range" className="dark-range" min="0.1" max="3" step="0.1" value={el.scale} onChange={e=>updateElement(activeControl, 'scale', parseFloat(e.target.value))} /></ControlRow>
            
            {(activeControl === 'whiteBox') && (<><SectionHeader icon={Layers} title="Box Dimensions" /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Width %"><input type="number" className="dark-input" value={el.width || 0} onChange={e=>updateElement(activeControl, 'width', parseInt(e.target.value))} /></ControlRow><ControlRow label="Height %"><input type="number" className="dark-input" value={el.height || 0} onChange={e=>updateElement(activeControl, 'height', parseInt(e.target.value))} /></ControlRow></div><ControlRow label={`Corner Radius: ${el.borderRadius || 0}px`}><input type="range" className="dark-range" min="0" max="50" value={el.borderRadius || 0} onChange={e=>updateElement(activeControl, 'borderRadius', parseInt(e.target.value))} /></ControlRow><ControlRow label="Background Color"><input type="color" value={el.backgroundColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'backgroundColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow></>)}
            
            {(activeControl === 'headerText' || activeControl === 'footerText' || activeControl === 'pinText') && (<ControlRow label="Text Color"><input type="color" value={el.color || '#000000'} onChange={e=>updateElement(activeControl, 'color', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow>)}
            
            {activeControl === 'qr' && (<><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><ControlRow label="Dots Color"><input type="color" value={el.qrFgColor || '#000000'} onChange={e=>updateElement(activeControl, 'qrFgColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow><ControlRow label="Background"><input type="color" value={el.qrBgColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'qrBgColor', e.target.value)} style={{width:'100%', height:'30px'}}/></ControlRow></div><div style={{marginTop:'10px'}}><label style={{color:'white', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'8px'}}><input type="checkbox" checked={el.frame || false} onChange={e=>updateElement(activeControl, 'frame', e.target.checked)} /> Enable Frame</label></div>{el.frame && (<ControlRow label="Frame Color"><input type="color" value={el.frameColor || '#ffffff'} onChange={e=>updateElement(activeControl, 'frameColor', e.target.value)} style={{width:'100%', height:'30px', marginTop:'5px'}}/></ControlRow>)}</>)}
            
            <div style={{marginTop:'20px', borderTop:'1px solid #334155', paddingTop:'10px'}}><label style={{color:'white', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px'}}><input type="checkbox" checked={el.shadow || false} onChange={e=>updateElement(activeControl, 'shadow', e.target.checked)} /> <Sun size={16} /> Enable Drop Shadow</label>{el.shadow && (<div style={{paddingLeft:'10px', borderLeft:'2px solid #4da6a9'}}><ControlRow label={`Angle: ${el.shadowAngle || 45}°`}><input type="range" className="dark-range" min="0" max="360" value={el.shadowAngle || 45} onChange={e=>updateElement(activeControl, 'shadowAngle', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Distance: ${el.shadowDistance || 5}px`}><input type="range" className="dark-range" min="0" max="50" value={el.shadowDistance || 5} onChange={e=>updateElement(activeControl, 'shadowDistance', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Blur: ${el.shadowBlur || 10}px`}><input type="range" className="dark-range" min="0" max="50" value={el.shadowBlur || 10} onChange={e=>updateElement(activeControl, 'shadowBlur', parseInt(e.target.value))} /></ControlRow><ControlRow label={`Opacity: ${el.shadowOpacity || 0.3}`}><input type="range" className="dark-range" min="0" max="1" step="0.1" value={el.shadowOpacity || 0.3} onChange={e=>updateElement(activeControl, 'shadowOpacity', parseFloat(e.target.value))} /></ControlRow></div>)}</div>
          </>
      );
  };

  return (
    <div style={{width:'320px', background:'#1e293b', borderRight:'1px solid #334155', display:'flex', flexDirection:'column'}}>
        <style>{`.dark-input{width:100%;background:#0f172a;border:1px solid #334155;color:white;padding:8px;border-radius:4px;box-sizing:border-box}.dark-range{width:100%;cursor:pointer}.tool-btn{padding:10px;cursor:pointer;color:#94a3b8;border-bottom:2px solid transparent;font-size:0.85rem;font-weight:bold;white-space:nowrap}.tool-btn.active{color:#4da6a9;border-bottom-color:#4da6a9}.tool-btn:hover{color:white}`}</style>
        
        <div style={{display:'flex', overflowX:'auto', background:'#0f172a', borderBottom:'1px solid #334155', padding:'0 10px'}}>
            {['banner', 'photo', 'qr', 'whiteBox', 'headerText', 'footerText', 'pinText'].map(k => (
                <div key={k} onClick={() => setActiveControl(k)} className={`tool-btn ${activeControl === k ? 'active' : ''}`}>
                    {k === 'whiteBox' ? 'Box' : k.replace('Text','')}
                </div>
            ))}
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
            {renderControls()}
        </div>
    </div>
  );
}
