import React,{Component} from "react";
import FileUpload from "./FileUpload";
import "./App.css"
import * as d3 from "d3"

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: []
    }
  }

  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  }

  componentDidUpdate() {
    this.renderSteamChart()
  }

  componentDidMount() {
    this.renderSteamChart()
  }

  renderSteamChart() {
    const data = this.state.data
    const colors = ["#e41a1c", "#377eb8", " #4daf4a", "#984ea3", "#ff7f00"]
    const keys = ["GPT4", "Gemini", "PaLM2", "Claude", "LLaMA3_1"]
    const maxSum = d3.sum([
      d3.max(data, d => d.GPT4),
      d3.max(data, d => d.Gemini),
      d3.max(data, d => d.PaLM2),
      d3.max(data, d => d.Claude),
      d3.max(data, d => d.LLaMA3_1)
    ]);
    
    const margin = { top: 20, right: 20, bottom: 50, left: 50 },
      width = 500 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;
    const xScale = d3.scaleTime().domain(d3.extent(data, d => d.Date)).range([0, width])
    const yScale = d3.scaleLinear().domain([0, maxSum]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().domain(keys).range(colors);

    // create stackGenerator
    var stackGen = d3.stack().keys(keys).offset(d3.stackOffsetWiggle)
    var stackedSeries = stackGen(data)

    // create areaGen
    var areaGen = d3.area().x(d=>xScale(d.data.Date))
                    .y0(d=>yScale(d[0]))
                    .y1(d=>yScale(d[1]))
                    .curve(d3.curveCardinal)

    const svg = d3.select(".container").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
    const chartGroup = svg.selectAll(".chart-group").data([null]).join("g").attr("class", "chart-group").attr("transform", `translate(${margin.left}, 0)`);

    // hover chart
    const hoverMargin = { top: 15, right: 10, bottom: 30, left: 30 },
      hoverWidth = 325 - hoverMargin.left - hoverMargin.right,
      hoverHeight = 225 - hoverMargin.top - hoverMargin.bottom;
    let div = d3.select("body").selectAll(".hoverChart").data([0]).join('div').attr("class", "hoverChart").style("opacity", 0)

    let hoverSVG = div.selectAll(".hoverSVG").data([0]).join("svg").attr("class","hoverSVG")
    .attr("width",hoverWidth + hoverMargin.left + hoverMargin.right,).attr("height",hoverHeight+hoverMargin.top+hoverMargin.bottom)
    
    hoverSVG.selectAll('.hoverG').data([0]).join("g").attr("class","hoverG")
    .attr("transform",`translate(${hoverMargin.left},${hoverMargin.top})`)
    //hover chart x axis
    const x_data = data.map(d=>d.Date.toLocaleDateString('default',{month:'short'}))
    let x_scale=d3.scaleBand().domain(x_data).range([0,hoverWidth]).padding(0.1)
    let x_axis_generator=d3.axisBottom(x_scale)

    d3.select('.hoverG').selectAll('.x_axis_g')
    .data([0]).join('g').attr("class","x_axis_g")
    .attr("transform",`translate(0,${hoverHeight-5})`)
    .call(x_axis_generator)

    // Draw areas
    chartGroup.selectAll(".areas").data(stackedSeries).join('path').attr('class','areas')
    .attr("d",d=>areaGen(d)).attr('fill',d=>colorScale(d.key)).attr("transform", `translate(0, -${margin.top+margin.bottom+10})`)
    .on("mousemove",(event,d)=>{
      div.style("opacity",1).style("left",(event.pageX/2)+"px").style("top",(event.pageY)+"px")
      // hover chart y axis
      let key = d.key
      let y_data=d.map(d=>d.data[key])
      let y_scale=d3.scaleLinear().domain([0,d3.max(y_data)]).range([hoverHeight,0])
      let y_axis_generator=d3.axisLeft(y_scale)
      d3.select('.hoverG').selectAll('.y_axis_g')
      .data([0]).join('g').attr("class","y_axis_g")
      .attr("transform",`translate(0,-5)`)
      .call(y_axis_generator)

      let combinedData = x_data.map((d, i) => ({
        x: d, 
        y: y_data[i],
      }))
      console.log(d)
      // hover chart bars
      hoverSVG.selectAll('rect').data(combinedData).join("rect")
      .attr("x", d=>x_scale(d.x)) 
      .attr("y", d=>y_scale(d.y))
      .attr("height",d=>hoverHeight-y_scale(d.y))
      .attr("width",x_scale.bandwidth())
      .attr("transform",`translate(${hoverMargin.left},10)`)
      .attr("fill",colorScale(key))
    })
    .on("mouseout",()=>{
      div.style("opacity",0)
    })
    // Draw x-axis
    if(data.length > 1) {
      chartGroup.selectAll(".x-axis").data([null]).join("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));
      // legend
      for(let i=0;i<colors.length;i++) {
        d3.select("#legend").selectAll(`.legendItem${i}`).data([0]).join('text').attr("class",`.legendItem${i}`).attr("x",25).attr("y",15+i*25).text(keys[i])
        d3.select("#legend").selectAll(`.legendItem${i}`).data([0]).join('rect').attr("class",`.legendItem${i}`).attr("x",0).attr("y",0+25*i).attr('width',20).attr('height',20).attr('fill',colors[colors.length-1-i])
      }
    }
  }

  render() {
    return (
      <>
        <FileUpload set_data={this.set_data}></FileUpload>
        <div id="chart">
          <svg className="container">
          </svg>
          <svg id="legend" width="100" height="200"></svg>
        </div>
      </>
    )
  }
}