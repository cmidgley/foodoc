function setupMermaid() {
    // setup Mermaid but tell it to not render yet
    mermaid.initialize({ 
        startOnLoad: false,
        useMaxWidth: false, 
        theme: "neutral", 
        disableScript: false, 
        flowchart: { 
            nodeSpacing: 20, 
            rankSpacing: 40, 
            htmlLabels: false 
        } 
    });
    $().ready(function() {
        // update tutorial "```mermaid" sections to use mermaid
        $('.language-mermaid code').addClass('mermaid');
        // let mermaid render now
        mermaid.init();
        // remove the 'height' from svg so it can be more responsive
        $('.mermaid svg').removeAttr('height');
        // and now fade in the graphics (we kept them opacity 0 to avoid flickering before rendering)
        $('.language-mermaid').fadeTo(500, 1);
    });
}