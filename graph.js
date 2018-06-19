var patents;
var patentNumbers;
var plotCount = 0;

function intersection(setA, setB) {
  var _intersection = new Set();
  for (var elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

var countSelection = async (nodeList) => {
  patents = []
  patentNumbers = [];
  nodeList.forEach(x => {
    fetch(`data/patents/` + `${x.id()}.json`.replace('/', '-'))
      .then(response => response.json())
      .then(json => {
        patents.push(json);


      })
    console.log(patents);
    setTimeout(() => {
      patents.forEach(xx => {
        console.log(Object.keys(xx));
        if (patentNumbers.length == 0) {
          patentNumbers = Object.keys(xx)
        } else patentNumbers.concat(Object.keys(xx));
      })
    }, 100
    )
    setTimeout(() => console.log(patentNumbers), 400)


  })

  return patents

}

var plotPatents = (sourceIn, plotTitle) => {

  var plt = Bokeh.Plotting;
  var xdr = new Bokeh.Range1d({ start: 142771680000, end: 1575119520000 });
  var plot = plt.figure({
    title:plotTitle,
    width:$('#patents-plot').clientWidth,
    height:200,tools:"",
    x_axis_type:"datetime",
    x_range:xdr,

  })

circle = plot.circle({ field: "x" }, { field: "y" }, {source: sourceIn});

circle.glyph.fill_alpha = 0.5
circle.glyph.line_alpha = 0.5

plot.yaxis.visible = false
plot.ygrid.visible = false
plot.toolbar_location = null



  Bokeh.Plotting.show(plot,$("#patents-plot"));
}

var plotOrg = (sourceIn, plotTitle) => {
  var plt = Bokeh.Plotting;
  colors = []
  colorStrs = ['#3288bd','#5e4fa2',  '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142']
  colorStrs.forEach(x => colors.push(new Color(x)))
  var p =  Bokeh.Charts.bar(sourceIn, {
    // axis_number_format: "0.[00]a",
    orientation: "horizontal",
    stacked: false,
    width:$('#patents-plot').clientWidth,
    bar_height: 20,
    palette: colorStrs
  });

p.toolbar_location = null
  $('#organisations').html("")
  plt.show(p,$('#organisations'))
  }


document.addEventListener("DOMContentLoaded", () => init_graph(lowerEdgeLimit = 50))


init_graph = async (lowerEdgeLimit = 10) => {
  var uri_edges = "data/edges.json"
  var uri_nodes = "data/nodes.json"

  fetch(uri_nodes)
    .then(response => response.json())
    .then(json => {
      fetch(uri_edges)
        .then(response => response.json())
        .then(json2 => {
          json2 = json2.filter(x => x['data']['weight'] > lowerEdgeLimit)
          data = json.concat(json2)
          var cy = cytoscape({

            container: document.getElementById('cy'), // container to render in

            elements: data,

            style: [ // the stylesheet for the graph
              {
                selector: 'node',
                style: {
                  'background-color': 'data(color)',
                  'label': 'data(id)',
                  'width': 'data(size)',
                  'height': 'data(size)',
                  'font-size': 0,
	                'font-weight': 'bold',
	                'text-valign': 'center',
                  'text-halign': 'center',
                  'color': '#fff',
                  'text-outline-width': 40,
	                'text-outline-color': 'data(color)',
                  'border-color': 'data(color)',
	                'text-outline-opacity': 1
                }
              },
              {
                selector: 'node:selected',
                style: {
                  'border-color': 'data(color)',
                  'border-opacity': 0.5,
                  'border-width': '250%'
                }
              },

              {
                selector: 'node:active',
                style: {
                  'overlay-opacity': 0
                }
              },
              {
                selector: 'edge',
                style: {
                  // 'width': 'data(weight)',
                  // 'opacity': 'data(weight)',
                  'line-color': '#ccc',
                  'target-arrow-color': '#ccc',
                  'target-arrow-shape': 'triangle'
                }
              }
            ],

            layout: {
              name: 'cose',
              padding: 75,
              // componentSpacing: 0,
              nodeOverlap: 40000000000000000
            }

          });
          var timeout
          cy.on('select unselect', async (event) => {
            // target holds a reference to the originator
            // of the event (core or element)
            var e = event.target;

            if (e === cy) {
              console.log('tap on background');
            } else {
              if (e.isNode()) {
                // console.log(`Node ID: ${e.id()}`);
                // console.log(`Patent Count: ${e.data('size')}`);
                clearTimeout(timeout)

                timeout = setTimeout(async () => {
                  $('#overview-p-1').html("")

                  var allSelectedPatents = []
                  var patentsPerCategory = []
                  var patentData = []
                  cy.$('node:selected').forEach(x => {
                    // console.log((x.id()))
                    // console.log(allSelectedPatents)
                    allSelectedPatents += (Object.keys(JSON.parse(x.data('patents'))));
                    var patPerCat = (Object.keys(JSON.parse(x.data('patents'))));
                    patentsPerCategory.push(patPerCat)
                    $('#overview-p-1').html($('#overview-p-1').html() + `<h3>${x.id()}</h3>`)
                    $('#overview-p-1').html($('#overview-p-1').html() + `<p><b>${(new Set(patPerCat)).size}/${x.data('size')}`
                    + ` unique/total</b></p>`)
                    $('#overview-p-1').html($('#overview-p-1').html() + `<p>${x.data('cpc_subgroup_title')}</p>`)
                  })


                  // console.log(allSelectedPatents.split(','));


                  if (allSelectedPatents.length > 0) {
                    allSelectedPatents = new Set(allSelectedPatents.split(','))
                    // console.log(typeof(allSelectedPatents));
                    // console.log((allSelectedPatents));

                    var totalSelectedPatent = allSelectedPatents.size

                    patentsPerCategory.forEach(xxx => {
                      xxx = new Set(xxx)
                      allSelectedPatents.forEach(pat => {
                        if (!xxx.has(pat)) {
                          allSelectedPatents.delete(pat);
                        }
                      })
                    })

                    patentData = JSON.parse(cy.$('node:selected')[0].data('patents'))
                    var datasource = new Bokeh.ColumnDataSource({
                      data: { x: [], y: [] }
                    });
                    barData={}

                    allSelectedPatents.forEach( x => {
                      curr = patentData[x]

                      datasource.data.x.push(curr['patent_date'])
                      datasource.data.y.push(Math.random())
                      if(barData[curr['assignee_organization']]){
                        barData[curr['assignee_organization']] += 1
                      }else{
                        barData[curr['assignee_organization']] = 1
                      }
                    })

                    var arrBarData =[]
                    for(a in barData){
                      arrBarData.push([a,barData[a]])
                     }
                     arrBarData.sort(function(a,b){return a[1] - b[1]});
                     arrBarData.reverse();
                    console.log(datasource.data, arrBarData);

                    plotTitle = "";
                    allSelectedNodes = cy.$('node:selected')


                    allSelectedNodes.forEach(x => plotTitle += (x.id() + "   "))


                    plotPatents(datasource, plotTitle)



                    barData = [['Organization','No. of patents matching selection']].concat(arrBarData.slice(0,10))
                    console.log(barData);

                    plotOrg(barData)

                    if (allSelectedPatents.size > 1111) {
                      // alert("clcaclaca")
                      $('#patents-table').html("<br><h3>Selection too big...</h3>");


                    }
                    else {


                        var tablesStr = `
                        <br>\
                    <table id="patent-table" class="display table" style="width: 100%;margin-bottom:111px;">\
                      <thead>\
                          <tr>\

                              <th>ID</th>\
                              <th>Title</th>\
                              <th>Date</th>\
                              <th>Organization</th>\
                              <th>City</th>\
                              <th>Country</th>\
                          </tr>\
                      </thead>\
                      <tbody>\
                    `;

                      var counter = 0;
                      allSelectedPatents.forEach(x => {
                        counter++;
                        current = patentData[x]
                         tablesStr +=
                            `<tr class=${counter%2 ==0 ? "" : "table-active"}><td  class="table-link"><a href="https://patents.justia.com/patent/${x}">${x}</a></td><td>${current['patent_title']}</td>`+
                            `<td>${new Date(current['patent_date']).toLocaleDateString()}</td><td>${current['assignee_organization']}</td><td>${current['assignee_city']}</td>`+
                            `<td>${current['assignee_country']}</td></tr>`;
                        if(counter === allSelectedPatents.size)
                        {

                           tablesStr += '</tbody></table>'
                        }
                      })
                      $('#patents-table').html(tablesStr)
                    }

                    var add = totalSelectedPatent > allSelectedPatents.size ? 1 : 0
                    $('#ft-h3-1').html(`<h1 id="ft-h3-1"><b>${allSelectedPatents.size}</b></h1><h5>patents matching selection</h5><h1 id="ft-h3-1"><b>${totalSelectedPatent + add}</b></h1><h5>total selected patents</h5>`)


                  } else {
                    $('#overview-p-1').html('<h3 id="overview-p-1">Select nodes to get info...</h3>')
                    $('#ft-h3-1').html(`<h1 id="ft-h3-1"></h1>`)
                    $('#patents-table').html("<br><h3>Select nodes to get info...</h3>");
                  }

                }
                  , 100)

              }
            }
          });

          cy.on('tap', function (event) {
            // target holds a reference to the originator
            // of the event (core or element)
            var e = event.target;

            if (e === cy) {
              $('#organisations').html("<br><h3>Select nodes to get info...</h3>")
              $('#overview-p-1').html('<br><h3>Select nodes to get info...</h3>')
              $('#ft-h3-1').html(`<h1 id="ft-h3-1"></h1>`)
              $('#patents').html(
              '<br>\
            <div id="patents-plot">\
            </div>\
            <br>\
            <div id="patents-table">\
              <h3>\
                Select nodes to get info...\
              </h3>\
            </div>');

            plotCount = 0;
            }
          })
          cy.on('mouseover', 'node', (event) =>{
            event.target.style(
                  {'font-size': 333,
	                'font-weight': 'bold',
	                'text-valign': 'center',
                  'text-halign': 'center',
                  'color': '#fff',
                  'text-outline-width': 88,
                  'text-outline-opacity': 1,
                  'border-opacity': 0.25,
                  'border-width': '250%'})
          })
          cy.on('mouseout', 'node', (event) =>{
            event.target.style(
                  {'font-size': 0,
	                'font-weight': 'bold',
	                'text-valign': 'center',
                  'text-halign': 'center',
                  'color': '#fff',
                  'text-outline-width': 40,
                  'text-outline-opacity': 1,
                  'border-opacity': event.target.selected() ? 0.5 : 0,
                  'border-width': '250%'})

          })
          cy.on('unselect', 'node', (event) =>{
            event.target.style(
                  {'border-opacity': 0})

          })
        })
    })
}
$(document).ready(function() {
  $('#patent-table').DataTable();
} );
