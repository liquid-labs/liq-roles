.DELETE_ON_ERROR:
.PHONY: all build test lint lint-fix

default: build

NPM_BIN:=$(shell npm bin)
CATALYST_SCRIPTS:=$(NPM_BIN)/catalyst-scripts

LIQ_ROLES_SRC:=src/
LIQ_ROLES_FILES:=$(shell find $(LIQ_ROLES_SRC) \( -name "*.js" -o -name "*.mjs" \) -not -path "*/test/*" -not -name "*.test.js")
LIQ_ROLES_TEST_SRC_FILES:=$(shell find $(LIQ_ROLES_SRC) -name "*.js")
LIQ_ROLES_TEST_BUILT_FILES:=$(patsubst $(LIQ_ROLES_SRC)/%, test-staging/%, $(LIQ_ROLES_TEST_SRC_FILES))
LIQ_ROLES:=dist/liq-roles.js

# browser files
CANVAS_HTML=dist/canvas.html
CANVAS_SRC=src/handlers/orgs/roles/lib/canvas.html
D3_JS=dist/d3.v7.js
D3_URL=https://d3js.org/d3.v7.js
D3_FLEXTREE_JS=dist/d3-flextree.js
D3_FLEXTREE_URL=https://cdn.jsdelivr.net/npm/d3-flextree@2.1.2/build/d3-flextree.js

BROWSER_FILES:=$(CANVAS_HTML) $(D3_JS) $(D3_FLEXTREE_JS)

BUILD_TARGETS:=$(LIQ_ROLES) $(BROWSER_FILES)

# build rules
build: $(BUILD_TARGETS)

all: build

$(LIQ_ROLES): package.json $(LIQ_ROLES_FILES)
	JS_SRC=$(LIQ_ROLES_SRC) $(CATALYST_SCRIPTS) build

$(CANVAS_HTML): $(CANVAS_SRC)
	cp $(CANVAS_SRC) $(CANVAS_HTML)

$(D3_JS):
	curl $(D3_URL) --output $(D3_JS)
	
$(D3_FLEXTREE_JS):
	curl $(D3_FLEXTREE_URL) --output $(D3_FLEXTREE_JS)

# test build and run rules
$(LIQ_ROLES_TEST_BUILT_FILES) &: $(LIQ_ROLES_TEST_SRC_FILES)
	JS_SRC=$(LIQ_ROLES_SRC) $(CATALYST_SCRIPTS) pretest

test: $(LIQ_ROLES_TEST_BUILT_FILES)
	JS_SRC=test-staging $(CATALYST_SCRIPTS) test

# lint rules
lint:
	JS_SRC=$(LIQ_ROLES_SRC) $(CATALYST_SCRIPTS) lint

lint-fix:
	JS_SRC=$(LIQ_ROLES_SRC) $(CATALYST_SCRIPTS) lint-fix
