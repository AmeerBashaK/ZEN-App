
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapData } from '../types';

interface MindMapProps {
  data: MindMapData;
  imageUrl?: string;
}

const MindMapVisualization: React.FC<MindMapProps> = ({ data, imageUrl }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<'cloud' | 'interactive'>(imageUrl ? 'cloud' : 'interactive');

  useEffect(() => {
    if (view !== 'interactive' || !svgRef.current || !data) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const width = 800;
    const height = 450;
    const margin = { top: 20, right: 150, bottom: 20, left: 150 };

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree<MindMapData>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy<MindMapData>(data);
    treeLayout(root);

    svg.selectAll(".mindmap-link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "mindmap-link")
      .style("stroke", "#334155")
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x) as any
      );

    const node = svg.selectAll(".mindmap-node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "mindmap-node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 5)
      .style("fill", "#1e293b")
      .style("stroke", "#3b82f6");

    node.append("text")
      .attr("dy", ".31em")
      .attr("x", d => d.children ? -12 : 12)
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("fill", "#cbd5e1")
      .style("font-size", "11px")
      .text(d => d.data.name);

  }, [data, view]);

  return (
    <div className="w-full bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
      <div className="flex border-b border-slate-800">
        {imageUrl && (
          <button 
            onClick={() => setView('cloud')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${view === 'cloud' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className="fa-solid fa-cloud mr-2"></i> Cloud Visual
          </button>
        )}
        <button 
          onClick={() => setView('interactive')}
          className={`flex-1 py-3 text-sm font-semibold transition-all ${view === 'interactive' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-diagram-project mr-2"></i> Interactive Map
        </button>
      </div>

      <div className="p-4 flex items-center justify-center min-h-[300px]">
        {view === 'cloud' && imageUrl ? (
          <div className="animate-fadeIn w-full">
            <img 
              src={imageUrl} 
              alt="Cloud Generated Mind Map" 
              className="w-full h-auto rounded-lg shadow-inner border border-slate-800"
            />
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-auto animate-fadeIn"></svg>
        )}
      </div>
    </div>
  );
};

export default MindMapVisualization;
