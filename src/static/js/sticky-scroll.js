// 
// Sticky Scroll: Copyright (c) 2020 Chris Midgley
//
// License: MIT
//
// sticky scroll allows an item to scroll in the page, but then become affixed to another item (typically the top) when it scrolls
// out of view.  Simpliest use case is this, where it will lock to the top of the window:
//
//      <div class='sticky-scroll'>Item I want to scroll and stick</div>
//
// If you add data-sticky-scroll-target="<jquery expression>", you can select a target to use for positioning the sticky point in the
// page (at the bottom of that target), including for targets that are sticky themselves (for stacking sticky navbars, for example). 
// If you have a menu with ID "menu", you might use this:
//
//      <div class='stick-scroll' data-sticky-scroll-target='#menu'>Item I want to scroll and stick</div>
//
// You can also add an offset (in pixels), which is offset from top of window, or from the stick-scroll-target if used.  For example:
//
//      <div class='sticky-scroll' data-sticky-scroll-offset='51'>My sticky content</div>
//
// This code automatically places the correct CSS to cause the 'stickyness' to occur, but if additional styling is desired, it also adds
// the 'sticky' class to the item when it is stuck onto the page.
//
// A hidden DIV is created just above the sticky element to reserve the space when the element becomes 'position: fixed'. It gets assigned
// a height equal to the scrolling item, and inherits all the classes of the item (except sticky-scroll) to allow the width to also get
// assigned.  If you are having problems with width, make sure your CSS styles apply to the classes on the DIV correctly.  You can always
// override these options by using the .stick class with !important styles.  This DIV is hidden, so there should be no visible effect of
// the assignment of those classes (though don't have a class that makes it visible, or alters its position).  Also see the events in the
// next paragraph for having even more precise control.
//
// There are two events available, data-sticky-scroll-on-stick and data-sticky-scroll-on-unstick.  You can include the name of a function
// which will get called along with the jQuery element that caused the trigger (the element that has the '.sticky-scroll' class on it).
// These are fired after all fixup has been completed, so more precise control over element changes can be controlled.
//
function stickyScroll(event) {
    var targetBottom = lockedPosition = event.data.topOffset;
    if (event.data.targetElem) {
        targetBottom += event.data.targetElem.offset().top + event.data.targetElem.outerHeight();
        lockedPosition += event.data.targetElem.position().top + event.data.targetElem.outerHeight();
    }
    else 
        targetBottom += $(window).scrollTop();

    var triggerEvent = false;
    if (targetBottom > event.data.anchorElem.offset().top) {
        if (!event.data.scrollingElem.hasClass('stick') && event.data.scrollingElem.data('sticky-scroll-on-stick'))
            triggerEvent = true;
        event.data.scrollingElem.addClass('stick')
            .attr('style', 'margin-top: 0; position: fixed; top: ' + lockedPosition + 'px; z-index: 1001; width: ' + event.data.anchorElem.width() + 'px');
        event.data.anchorElem.height(event.data.scrollingElem.outerHeight());
        if (triggerEvent)
            window[event.data.scrollingElem.data('sticky-scroll-on-stick')](event.data.scrollingElem);
    } else {
        if (event.data.scrollingElem.hasClass('stick') && event.data.scrollingElem.data('sticky-scroll-on-unstick'))
            triggerEvent = true;
        event.data.scrollingElem.removeClass('stick').attr('style', '');
        event.data.anchorElem.height(0);
        if (triggerEvent)
            window[event.data.scrollingElem.data('sticky-scroll-on-unstick')](event.data.scrollingElem);
    }
}
// when document ready, if we have an item with the stick-scroll class, set up our scroll
$(function() {
    if ($('.sticky-scroll').length) {
        $('.sticky-scroll').each(function() {
            var anchorElem = $("<div></div>").insertBefore($(this));
            anchorElem.attr('class', $(this).attr('class'));
            anchorElem.removeClass('sticky-scroll');
            var offset = 0;
            var targetElem;
            if ($(this).data('sticky-scroll-target')) {
                var target = $($(this).data('sticky-scroll-target'));
                if (target.length)
                    targetElem = target;
                else
                    console.error('StickyScroll unable to locate target ' + $(this).data('sticky-scroll-target'));
            }
            if ($(this).data('sticky-scroll-offset'))
                offset += $(this).data('sticky-scroll-offset');
            var eventData = {
                scrollingElem: $(this), 
                anchorElem: anchorElem, 
                targetElem: targetElem,
                topOffset: offset
            };
            $(window).scroll(eventData, stickyScroll).resize(eventData, stickyScroll);
            stickyScroll({ data: eventData });
        });
    }
});
