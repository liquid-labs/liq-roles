.DELETE_ON_ERROR:
.PHONY: all test lint lint-fix

default: all

NPM_BIN:=$(shell npm bin)
CATALYST_SCRIPTS:=$(NPM_BIN)/catalyst-scripts

LIQ_ROLES_SRC:=src/
LIQ_ROLES_FILES:=$(shell find $(LIQ_ROLES_SRC) -name "*.js" -not -path "*/test/*" -not -name "*.test.js")
LIQ_ROLES_TEST_SRC_FILES:=$(shell find $(LIQ_ROLES_SRC) -name "*.js")
LIQ_ROLES_TEST_BUILT_FILES:=$(patsubst $(LIQ_ROLES_SRC)/%, test-staging/%, $(LIQ_ROLES_TEST_SRC_FILES))
LIQ_ROLES:=dist/liq-roles.js
	
BUILD_TARGETS:=$(LIQ_ROLES)

# build rules
all: $(BUILD_TARGETS)

$(LIQ_ROLES): package.json $(LIQ_ROLES_FILES)
	JS_SRC=$(LIQ_ROLES_SRC) $(CATALYST_SCRIPTS) build

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
