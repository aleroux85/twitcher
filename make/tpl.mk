# Usage:
#   $(call tpl-include, TEMPLATE, PLACEHOLDER, INCLUDEFILE, OUTPUT)

# Function to inject code with indentation preserved
# define inject_with_indent
# 	@awk -v placeholder='$(3)' -v insert_file='$(2)' '\
# 	$$0 ~ placeholder { \
# 		match($$0, /^[[:space:]]*/) ; \
# 		indent = substr($$0, RSTART, RLENGTH) ; \
# 		while ((getline line < insert_file) > 0) { \
# 			print indent line ; \
# 		} ; \
# 		close(insert_file) ; \
# 		next ; \
# 	} \
# 	{ print } \
# 	' '$(1)' > '$(4)'
# endef

define compose
	@awk '\
	BEGIN { \
		while ((getline < "$(2)") > 0) { \
			split($$0, parts, ":") ; \
			map[parts[1]] = parts[2] ; \
		} ; \
		close("$(2)") ; \
	} \
	{ \
		found = 0 ; \
		for (placeholder in map) { \
			if ($$0 ~ placeholder) { \
				match($$0, /^[[:space:]]*/) ; \
				indent = substr($$0, RSTART, RLENGTH) ; \
				while ((getline line < map[placeholder]) > 0) { \
					print indent line ; \
				} ; \
				close(map[placeholder]) ; \
				found = 1 ; \
				break ; \
			} ; \
		} ; \
		if (!found) print ; \
	} \
	' '$(1)' > '$(3)'
endef