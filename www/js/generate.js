function strhash(str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

var color_count = 18;
function numToColor(v) {
    return `hsl(${(v % color_count) * 360 / color_count}, 80%, 50%)`;
}

function partTime(epoch) {
    var date = new Date(0);
    date.setUTCSeconds(new Number(epoch));
    return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function gen_scoreboard(scoreboard_div, current_day, memberlist, membercolors) {
    var first_row = document.createElement("div");
    first_row.className = "privboard-row";
    first_row.innerHTML = "      ";
    var inner = document.createElement("span");
    inner.className = "privboard-days";
    for (var i = 0; i < 25; i++) {
        var day = (i + 1).toString().padStart(2);
        var daydiv = null;
        if (i < current_day) {
            daydiv = document.createElement("a");
            daydiv.href = '/2020/day/' + day;
        } else {
            daydiv = document.createElement("span");
        }
        if (day[0] == ' ') {
            daydiv.innerHTML += day[1];
        } else {
            daydiv.innerHTML += day[0] + "<br>" + day[1];
        }
        inner.appendChild(daydiv);
    }
    inner.innerHTML += '<br>';
    first_row.appendChild(inner);
    scoreboard_div.appendChild(first_row);

    document.getElementById("leader-name").innerHTML = memberlist[0].name;
    document.getElementById("leader-score").innerHTML = memberlist[0].local_score;

    for (var memid in memberlist) {
        var mem = memberlist[memid];
        var row = document.createElement("div");
        row.className = "privboard-row";
        row.innerHTML = '<span class="privboard-position">' + (Number(memid) + 1).toString() + ')</span> <pre style="display:inline">' + mem["local_score"].toString().padStart(2) + '</pre> ';
        var completed_days = mem.completion_day_level;
        for (var i = 0; i < 25; i++) {
            if (!completed_days.hasOwnProperty((i + 1).toString())) {
                if (i >= current_day) {
                    row.innerHTML += '<span class="privboard-star-locked">*</span>';
                } else {
                    row.innerHTML += '<span class="privboard-star-unlocked">*</span>';
                }
            } else {
                if (completed_days[(i + 1).toString()].hasOwnProperty("2")) {
                    row.innerHTML += '<span class="privboard-star-both">*</span>';
                } else {
                    row.innerHTML += '<span class="privboard-star-single">*</span>';
                }
            }
        }
        row.innerHTML += '<pre style="display:inline"> </pre>(<span style="color:' + membercolors[memid] + '">*</span>)<span class="privboard-name"><a class="action" onclick="reload_action(' + memid + ')">' + mem.name + '</a></span>';
        scoreboard_div.appendChild(row);
    }
}

async function reload(plottarget) {
    var scoreboard = await fetch("/data/scoreboard.json")
        .then(response => response.text())
        .then(text => JSON.parse(text));

    /* check date */
    var date = new Date();
    var current_day = 0;
    if (date.getFullYear() > scoreboard["event"]) {
        current_day = 26;
    } else if (date.getMonth() == 11) {
        current_day = date.getDate();
    }

    var scoreboard_div = document.getElementById("scoreboard");
    var members = scoreboard["members"]
    var memberlist = Object.values(members);
    memberlist.sort(function(a,b) {return b.local_score - a.local_score});

    /* generate member colors */
    membercolors = []
    for (var i = 0; i < memberlist.length; i++) {
        var seed = strhash(memberlist[i].name);
        var rand = Math.floor(mulberry32(seed)() * 36);
        var color = numToColor(rand);
        if (i < color_count) { /* try to avoid collisions for small number of members */
            while (membercolors.includes(color)) {
                rand += 1;
                color = numToColor(rand);
            }
        }
        membercolors.push(color);
    }

    if (scoreboard_div.children.length == 0) {
        gen_scoreboard(scoreboard_div, current_day, memberlist, membercolors);
    }

    var traces1 = [];
    var traces2 = [];
    for (var memid in memberlist) {
        if (plottarget != null && plottarget != memid)
            continue;
        var trace1 = { x: [], y: [], textposition: "inside", type: 'bar', marker: { color: membercolors[memid] } };
        var trace2 = { x: [], y: [], textposition: "inside", type: 'bar', marker: { color: membercolors[memid] } };
        var completed_days = memberlist[memid].completion_day_level;
        for (var i = 0; i < current_day; i++) {
            trace1.name = memberlist[memid].name;
            trace2.name = memberlist[memid].name;

            var day = (i + 1).toString();
            if (completed_days.hasOwnProperty(day)) {
                trace1.x.push(day);
                trace1.y.push(partTime(completed_days[day][1].get_star_ts));
                if (completed_days[day].hasOwnProperty("2")) {
                    trace2.x.push(day);
                    trace2.y.push(partTime(completed_days[day][2].get_star_ts) - partTime(completed_days[day][1].get_star_ts));
                }
            }

        }
        traces1.push(trace1);
        traces2.push(trace2);
    }

    var traceavg = [];
    for (var i = 0; i < current_day; i++) {
        for (var memid in memberlist) {
        }
    }

    var base_layout = {
        fixedrange: true,
        showlegend: false,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        modebar: false,
        font: {
            color: "#fff",
            size: 14,
            family: "monospace",
            autosize: true
        }
    };

    var layout1 = {};
    Object.assign(layout1, base_layout);
    layout1.title = 'minutes for part 1';
    layout1.margin = {b: 40};

    var layout2 = {};
    Object.assign(layout2, base_layout);
    layout2.title = 'minutes for part 2';
    layout2.margin = {b: 40};

    var config = {responsive: true};

    Plotly.newPlot('part1-plot', traces1, layout1, config);
    Plotly.newPlot('part2-plot', traces2, layout2, config);
}

var last_target = null;
function reload_action(target) {
    if (target == last_target) {
        last_target = null;
    } else {
        last_target = target;
    }
    reload(last_target);
}

reload(null);
