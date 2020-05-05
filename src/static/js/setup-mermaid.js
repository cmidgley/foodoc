function setupMermaid() {
    // setup Mermaid options
    mermaid.initialize({ 
        useMaxWidth: false, 
        theme: "neutral", 
        disableScript: false, 
        securityLevel: 'loose',
        flowchart: { 
            nodeSpacing: 20, 
            rankSpacing: 40, 
            htmlLabels: false 
        } 
    });
    // extend jQuery to have a new exact-match filter (like :contains)
    $.expr[':'].containsMember = function(el, i, m) {
        var searchText = m[3];
        var match = $(el).text().trim().match("^" + searchText + "(\\(\\))?$");
        return match && match.length > 0;
    }
    // when document ready, process all our custom mermaid sections (must be <pre class='language-mermaid'><code></code></pre>), and
    // pre-process the mermaid markdown to add:
    //
    // * style <codeClassName>{.<codeMemberName>} <cssClassName>
    // * filter <codeClassName>{.<codeMemberName>} <cssClassName>
    //
    // The style feature adds the specified class to the containing <g>. For example, to background fill
    // the class 'baseClass' with the color yellow, and change text of memberTwo to red in that class, use:
    //
    // classDiagram
    //   inheritedClass <| --- baseClass
    //   class baseClass {
    //      memberOne
    //      memberTwo
    //   }
    // style baseClass highlightClass
    // style baseClass.memberTwo highlightMember
    //
    // and in the css:
    //
    // .highlightClass rect {
    //   fill: yellow !important;
    // }
    // .highlightMember {
    //   fill: red;
    // }
    // 
    // The filter feature is similar, except that rather than styling the member with the class, it uses the class to determine
    // if the item should be rendered. If the class is assigned (or not assigned if class name preceeded with '!') on any parents 
    // of the member, it is rendered. If it is not active, the member is hidden (removed) from rendering. This allows for features
    // such as having a filter, such as on the access level(public, protected, private, inherited) of the member, and removing/adding 
    // those members live without a server round trip.
    // 
    // Unlike using style to hide the member (display: none), this actually hides it from the markdown (though keeps the original 
    // for future class changes) so Mermaid will render boxes of the correct size given the missing elements. After changing 
    // class assignments, you must call mermaid.rerender() to cause all drawings on the page to be updated.
    $().ready(function() {
        mermaid._customRules = [];
        var mermaidID = 0;
        // before we render, decode, store and remove all our style/filter markdown so we don't mess up Mermaid, then tuck away the
        // Mermaid markdown in a hidden div so we can reference during rerendering.
        $('.language-mermaid code').replaceWith(function() { 
            // capture (and remove) all uses of style and filter 
            var styleRules = [];
            var filterRules = [];
            var text = $(this).text().replace(/^\s*(style|filter)\s+(\S+?)(?:\.(\S+?))?\s+(\S+?)\s*$/gm, function(fullMatch, rule, codeClass, codeMember, cssClass) {
                if (rule == 'style')
                    styleRules.push({ codeClass: codeClass, codeMember: codeMember, cssClass: cssClass });
                else
                    filterRules.push({ codeClass: codeClass, codeMember: codeMember, cssClass: cssClass });
                return '';
            });
            // remove unwanted blank lines
            text = text.replace(/^\s*\n/gm, '');

            if (styleRules.length || filterRules.length) 
                mermaid._customRules.push({ elem: $(this).parent(), styleRules: styleRules, filterRules: filterRules });
            // adjust the code to have our desired class and ID, as well as our purified (no style/filter) Mermaid markdown (in code and hidden div)
            ++mermaidID;
            return "<code id='mermaid-" + mermaidID + "' class='filtered-mermaid'></code><div id='md-mermaid-" + mermaidID + "' style='display: none'>" + text + "</div>"; 
        });
        // force render all
        mermaid.rerender();
    });

    mermaid.rerender = function() {
        // have we initialized?
        if (!mermaid._customRules)
            return;
        // cause them all to render
        $('.filtered-mermaid').each(function() { 
            var elementId = $(this).attr('id');
            var markdown = $('#md-' + elementId).text();
            // filter the markdown
            mermaid._customRules.forEach(function(section) {
                if (section.elem.find('code').attr('id') === elementId) {
                    section.filterRules.forEach(function(rule) {
                        // does the class apply?
                        var remove;
                        if (rule.cssClass.charAt(0) == '!')
                            remove = !section.elem.closest('.' + rule.cssClass.substring(1)).length;
                        else
                            remove = section.elem.closest('.' + rule.cssClass).length;
                        if (remove) {
                            // match the member, that is encapsulated within class <rule.codeClass> { ... <rule.codeMember> ... }
                            var filter = "(class\\s+" + rule.codeClass + "\\s+{.*?)\\s(" + rule.codeMember + "(?:\\(\\))?)\\s(.*?})";
                            console.log("Filter is", filter);
                            markdown = markdown.replace(new RegExp(filter, 'gs'), '$1$3');
                        }
                    });
                }
            }); 
            // remove unwanted blank lines
            markdown = markdown.replace(/^\s*\n/gm, '');
            console.log(markdown);
            // render with mermaid
            $(this).html(mermaid.render('rend-' + $(this).attr('id'), markdown));
        });

        // process those styles onto the generated mermaid items
        mermaid._customRules.forEach(function(section) {
            section.styleRules.forEach(function(rule) {
                var classElem = section.elem.find("svg :containsMember('" + rule.codeClass + "'):not(:has(*))").closest('g');
                if (rule.codeMember)
                    classElem.find('tspan:containsMember("' + rule.codeMember + '")').addClass(rule.cssClass);
                else
                    classElem.addClass(rule.cssClass);
            });
        });
        // remove the 'height' from svg so it can be more responsive
        $('.filtered-mermaid svg').removeAttr('height');
        //  fade in the graphics (we kept them opacity 0 to avoid flickering before rendering)
        $('.filtered-mermaid').fadeTo(250, 1);
    };
}