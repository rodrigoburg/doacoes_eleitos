var cores = {
    "PT"       :["#a00200",1],
    "PST"      :["#a51001",2],
    "PL"       :["#aa1d01",3],
    "PTC"      :["#b02b01",4],
    "PC do B"    :["#b53901",5],
    "PP"       :["#ba4601",6],
    "PRB"      :["#bf5301",7],
    "PSL"      :["#c46102",8],
    "PPL"      :["#ca6f03",9],
    "PSB"      :["#cf7d03",10],
    "PMDB"     :["#d48b03",11],
    "PROS"     :["#d99803",12],
    "PRTB"     :["#dea604",13],
    "PTB"      :["#e4b304",14],
    "PRP"      :["#e9c104",15],
    "PDT"      :["#eece04",16],
    "PHS"      :["#f3dc05",17],
    "PR"       :["#f4e509",18],
    "PSC"      :["#eae116",19],
    "PMR"      :["#dfdd24",20],
    "PT do B"    :["#d5d931",21],
    "PV"       :["#cad63e",22],
    "PMN"      :["#c0d24b",23],
    "PSD"      :["#b6ce58",24],
    "PEN"      :["#abc966",25],
    "PTN"      :["#abc966",25],
    "SD"      :["#a1c673",26],
    "PSOL"     :["#97c281",27],
    "PPS"      :["#8cbe8e",28],
    "DEM"      :["#82ba9b",29],
    "PFL_DEM"  :["#77b6a8",30],
    "PSDB"     :["#6db3b6",31],
    "PRONA"    :["#62afc3",32],
    "PAN"      :["#58abd0",33],
    "PSDC"     :["#4da7de",34],
    // "ZZZ"   :["#43a3eb",35],
    "S.Part."   :["#999999",35]
}

var tamanho = 0;

var margin = {top: 20, right: 0, bottom: 40, left: 0},
    //aspect = 400 / 950,
    width = $("#chart").width(),
    height = ($("#chart").height()-margin.bottom/3), //width * aspect,
    aspect = height / width,//height / width,
    formatNumber = d3.format(",d"),
    transitioning;

//Para Tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
      .style("opacity", 0);

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

var treemap = d3.layout.treemap()
    .children(function(d, depth) { return depth ? null : d._children; })
    .sort(function(a, b) { return a.value - b.value; })
    .ratio(aspect * 0.3 * (1 + Math.sqrt(5)))
    .round(false);

var svg = d3.select("#chart").append("svg")
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", width )
    .attr("height", height + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .style("shape-rendering", "crispEdges");

$(window).resize(function(){
    var width = $("#chart").width();
    svg.attr("width", width);
    svg.attr("height", height);
});

var grandparent = svg.append("g")
    .attr("class", "grandparent");

grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

d3.json("dados/doacoes_eleitos.json", function(root) {
  initialize(root);
  accumulate(root);
  layout(root);
  display(root);

  function initialize(root) {
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
  }

  // Aggregate the values for internal nodes. This is normally done by the
  // treemap layout, but not here because of our custom implementation.
  // We also take a snapshot of the original children (_children) to avoid
  // the children being overwritten when when layout is computed.
  function accumulate(d) {
    return (d._children = d.children)
        ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
        : d.value;
  }

  // Compute the treemap layout recursively such that each group of siblings
  // uses the same size (1×1) rather than the dimensions of the parent cell.
  // This optimizes the layout for the current zoom state. Note that a wrapper
  // object is created for the parent node for each group of siblings so that
  // the parent’s dimensions are not discarded as we recurse. Since each group
  // of sibling was laid out in 1×1, we must rescale to fit using absolute
  // coordinates. This lets us use a viewport to zoom.
  function layout(d) {
    if (d._children) {
      treemap.nodes({_children: d._children});
      d._children.forEach(function(c) {
        c.x = d.x + c.x * d.dx;
        c.y = d.y + c.y * d.dy;
        c.dx *= d.dx;
        c.dy *= d.dy;
        c.parent = d;
        layout(c);
      });
    }
  }

  function display(d) {
    grandparent
        .datum(d.parent)
        .on("click", transition)
      
      .select("text")
        .text("VOLTAR - "+name(d).replace(".","/"));

    var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

    var g = g1.selectAll("g")
        .data(d._children)
      .enter().append("g");

    g.filter(function(d) { return d._children; })
        .classed("children", true)
        .on("click", transition)
      
        
    g.selectAll(".child")
        .data(function(d) { return d._children || [d]; })
      .enter().append("rect")
        .attr("class", "child")
        .call(rect);

    g.append("rect")
        .attr("class", "parent")
        .call(rect)
        .attr("id",function (d) { return tira_espaco(d.name)})
        .on('mouseover', function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 1);
            div.html(("<b>"+arruma_nome(d.name) + "</b><br/>R$ " + formatNumber(d.value)).replace(",",".").replace(",",".") + "<br/>" + (parseInt(d.area * 1000)/10 + "%") + " " + arruma_tooltip(d))
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY + 28) + "px")

        })
        .on('touchstart', function(d) {
            var t2 = d3.event.timeStamp,
                t1 = $(this).data('lastTouch') || t2,
                dt = t2 - t1,
                fingers = d3.event.touches.length;
            $(this).data('lastTouch',t2);
            if (!dt || dt > 700 || fingers > 1) {
                div.transition()
                    .duration(200)
                    .style("opacity", 1);
                div.html((arruma_nome(d.name) + ":<br/>R$ " + formatNumber(d.value)).replace(",",".").replace(",",".") + "<br/>" + (parseInt(d.area * 1000)/10 + "%") + " " + arruma_tooltip(d))
                    .style("left", (d3.event.touches[0].pageX - 60) + "px")
                    .style("top", (d3.event.touches[0].pageY - 60) + "px");
                d3.event.preventDefault();
            } else {
                div.transition()
                    .duration(800)
                    .style("opacity", 0);
            }
        })
        .on('mousemove', function(d) {
            div.style("left", (d3.event.pageX - 100) + "px")
                .style("top", (d3.event.pageY - 60) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });


        //aqui coloca o texto só se a área for grande o suficiente...
    g.append("text")
        .attr("dy", ".75em")
        .text(function(d) { 
            retorno = d.name
            if (d.area < 0.01) { retorno = "" }
            return retorno
        })
        .style("font-size", function(d) { 
            tamanho = Math.min((d.area+0.03)*25,10)
            if (d.name.length > 20) {
                tamanho = Math.min(tamanho*0.75,10)
            }
            return (tamanho*window.width/1718) + "em"; })
        .attr("width", function(d) { return $("rect[nome='"+d.name+"']").attr("width") })
        .call(text)
        .each(arrumaTexto)

    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;

      div.transition()
        .duration(800)
        .style("opacity", 0);

      var g2 = display(d),
          t1 = g1.transition().duration(750),
          t2 = g2.transition().duration(750);

      // Update the domain only after entering new elements.
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);

      // Transition to the new view.
      t1.selectAll("text").call(text).style("fill-opacity", 0);
      t2.selectAll("text").call(text).style("fill-opacity", 1).each("end",arrumaTexto);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);
      

      // Remove the old node when the transition is finished.
      t1.remove().each("end", function() {
        svg.style("shape-rendering", "crispEdges");
        transitioning = false;
      });
            
      //mostra o div de doadores se estiver nessa tela
      if ($("text:contains('VOLTAR')").text() == "VOLTAR - Doadores") {
          $("#diversos").hide()
          $("#aecio").hide()
          
      } else if ($("text:contains('VOLTAR')").text() == "VOLTAR - Doadores/Presidente (Dilma Rousseff)") {
              $("#diversos").show()
              $("#aecio").show()
      
      }
      else if ($("text:contains('Diversos')").length > 0) {
          $("#diversos").show()
          $("#aecio").hide()
      
    } else {
          $("#diversos").hide()
          $("#aecio").hide()
      }
    }
    return g;
  }

  function text(text) {
    text.attr("x", function(d) { return x(d.x) + 6; })
        .attr("y", function(d) { return y(d.y) + 6; })
  }

  function rect(rect) {
    rect.attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y); })
        .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
        .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
  }

  function name(d) {
    saida = d.parent
        ? name(d.parent) + "/" + d.name
        : d.name;
    saida = arruma_voltar(saida)
    return saida
  }
});


function arrumaTexto(d) {
    if(d.area > 0.01) { 
        var nome = d.name,
        id = tira_espaco(nome),
        elemento = $(this),
        pos_y = elemento.attr("y"),
        pos_x = elemento.attr("x"),
        dy = 1
        if(nome != "" && nome.indexOf("VOLTAR") < 0) {
            var texto = d3.select(this),
            words = nome.split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            tspan = texto.text(null).append("tspan").attr("dy", dy + "em"),
            width = parseFloat($("rect#"+id+".parent").attr("width")) - 20
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan[0][0].offsetWidth > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = texto.append("tspan").attr("x",pos_x).attr("dy", dy + "em").text(word);
                    tspan.attr("x",pos_x)
                }
            }
        }
    }
}

function tira_espaco(t) {
    return t.replace(/\s+/g,"").replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'')
}

function arruma_voltar(texto) {

    if (texto == "Doadores/Presidente") {
        return "Doadores/Presidente (Dilma Rousseff)"
    }        
    else if (texto.indexOf("Governadores/") > -1) {
        uf = texto.split("/")[2]
        return texto.replace(uf,acha_gov(uf))
        
    }
    return texto
}

function acha_gov(t) {
    if (t == "AC") return "Tião Viana (PT)"
    if (t == "AL") return "Renan Filho (PMDB)"
    if (t == "AP") return "Waldez Góes (PDT)"
    if (t == "AM") return "José Melo (Pros)"
    if (t == "BA") return "Rui Costa (PT)"
    if (t == "CE") return "Camilo Santana (PT)"
    if (t == "DF") return "Rodrigo Rollemberg (PSB)"
    if (t == "ES") return "Paulo Hartung (PMDB)"
    if (t == "GO") return "Marconi Perillo (PSDB)"
    if (t == "MA") return "Flávio Dino (PCdoB)"
    if (t == "MG") return "Fernando Pimentel (PT)"
    if (t == "MT") return "Pedro Taques (PDT)"
    if (t == "MS") return "Reinaldo Azambuja (PSDB)"
    if (t == "PA") return "Simão Jatene (PSDB)"
    if (t == "PB") return "Ricardo Coutinho (PSB)"
    if (t == "PE") return "Paulo Câmara (PSB"
    if (t == "PI") return "Wellington Dias (PT)"
    if (t == "PR") return "Beto Richa (PSDB)"
    if (t == "RJ") return "Luiz Fernando Pezão (PMDB)"
    if (t == "RN") return "Robinson Faria (PSD))"
    if (t == "RS") return "José Ivo Sartori (PMDB"
    if (t == "RO") return "Confúcio Moura (PMDB)"
    if (t == "RR") return "Suely Campos (PP)"
    if (t == "SC") return "Raimundo Colombo (PSD)"
    if (t == "SE") return "Jackson Barreto (PMDB)"
    if (t == "SP") return "Geraldo Alckmin (PSDB)"
    if (t == "TO") return "Marcelo Miranda (PMDB)"
    return t
}
function arruma_nome(t) {
    if (t == "Presidente") return "Presidente (Dilma Rousseff)"
    if ($("text:contains('VOLTAR')").text() == "VOLTAR - Doadores/Governadores") {
        return acha_gov(t)
    }
    return t
    
}

function mostra_aecio (){
	newwindow=window.open("aecio.html",'name','height='+height+',width='+width);
	if (window.focus) {newwindow.focus()}
	return false;
}

function arruma_tooltip(d) {
    
    t = d.parent.name
    if (t == "Doadores") {
        return "do total doado"
    }
    
    if (t == "Deputados federais") {
        return "dos Deputados federais"
    }
    
    if (t == "Deputados estaduais") {
        return "dos Deputados estaduais"
    }
    
    if (t == "Governadores") {
        return "dos Governadores"
    }
    
    if (t == "Presidente") {
        return "da Presidente (Dilma Rousseff)"
    }
    
    if (t == "Senadores") {
        return "dos Senadores"
    }

    if (d.parent.parent.name == "Governadores") {
        return "de " + acha_gov(t)        
    }
        
    return "de " + t
}

$("#diversos").hide()
$("#aecio").hide()

