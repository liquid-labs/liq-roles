CANVAS_HTML=$(DIST)/canvas.html
CANVAS_SRC=$(SRC)/handlers/orgs/roles/lib/canvas.html
D3_JS=$(DIST)/d3.v7.js
D3_URL=https://d3js.org/d3.v7.js
D3_FLEXTREE_JS=$(DIST)/d3-flextree.js
D3_FLEXTREE_URL=https://cdn.jsdelivr.net/npm/d3-flextree@2.1.2/build/d3-flextree.js

BROWSER_FILES:=$(CANVAS_HTML) $(D3_JS) $(D3_FLEXTREE_JS)

BUILD_TARGETS+=$(BROWSER_FILES)

$(CANVAS_HTML): $(CANVAS_SRC)
	cp $(CANVAS_SRC) $(CANVAS_HTML)

$(D3_JS):
	curl $(D3_URL) --output $(D3_JS)
	
$(D3_FLEXTREE_JS):
	curl $(D3_FLEXTREE_URL) --output $(D3_FLEXTREE_JS)