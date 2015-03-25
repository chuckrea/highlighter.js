/* global jQuery */

/*
 * Highlighter.js 1.0
 *
 * Author: Matthew Conlen <matt.conlen@huffingtonpost.com>
 *         Huffington Post Labs
 *
 * Copyright 2012: Huffington Post Labs
 *
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the WTFPL, Version 2, as
 * published by Sam Hocevar. See http://sam.zoy.org/wtfpl/
 * for more details.
 */

/*
* Original library highly edited by Chuck Rea <chuckr523@mac.com>
*
* This version more closely mirrors the functionality of the comment mechanism
* used on Medium.com
*
* This version does NOT handle triple click events as they seemed to prove unpredictable and unstable
* (and are also NOT handled/permitted in Medium)
*
* For a full Medium.com style comments experience, please use this library
* in conjunction with the excellent SideCommments.js
*
* https://github.com/aroc/side-comments
*
* Note: Any parameters may be passed to the 'complete' callback function (called on line 147).
* The currently passed parameters are specific to the author's needs.
*
* */

  var parentCommentContainer;
 var originalElement;
    (function ($) {

    var methods = {
        init: function (options) {

            var settings = $.extend({
                'selector': '.highlighter-container',
                'minWords': 0,
                'complete': function() {}
            }, options);
            var numClicks = 0;
            var topOffset = 0;
            var leftOffset = 0;
            var isDown = false;

        var selText;

            return this.each(function () {
                /*
                 * Insert an html <span> after a user selects text.
                 * We then use the X-Y coordinates of that span
                 * to place our tooltip.
                 * Thanks to http://stackoverflow.com/a/3599599 for
                 * some inspiration.
                 */
                function insertSpanAfterSelection(clicks) {

                    var html = "<span class='dummy'><span>";
                    topOffset = 0;
                    leftOffset = 0;

                    if (numClicks !== clicks) return;
                    if (numClicks === 3) return;

                    var isIE = (navigator.appName === "Microsoft Internet Explorer");
                    var sel, range, expandedSelRange, span, origHtml, text, startText, endText, node;
                    var position;
                    if (window.getSelection) {
                        sel = window.getSelection();
                        selText = sel.toString();

                        if ($.trim(selText) === '' || selText.split(' ').length < settings.minWords) return;
                        if (sel.anchorNode.parentElement != sel.extentNode.parentElement) return;

                        if (sel.getRangeAt && sel.rangeCount) {
                            range = sel.getRangeAt(0);

                            if (range.startOffset === 0 && range.endOffset === 0) {
                                return;
                            } else if(range.endOffset === 0) {
                                return;
                            }

                            expandedSelRange = range.cloneRange();
                            expandedSelRange.collapse(false);

                            originalElement = $(range.startContainer.parentElement);
                            span = '<span class="highlighted-section">' + sel + '</span>';
                            text = originalElement.text();
                            origHtml = originalElement.html();
                            startText = text.substring(0, range.startOffset);
                            endText = text.substring(range.endOffset, text.length);

                            // Range.createContextualFragment() would be useful here but is
                            // non-standard and not supported in all browsers (IE9, for one)
                            var el = document.createElement("div");
                            el.innerHTML = html;
                            var dummy = document.createElement("span");

                            if (numClicks !== clicks) return;

                            $(settings.selector).hide();
                            if (!isIE && $.trim(selText) === $.trim(expandedSelRange.startContainer.innerText)) {
                                expandedSelRange.startContainer.innerHTML += "<span class='dummy'>&nbsp;</span>";
                                position = $(".dummy").offset();
                                $(".dummy").remove();
                            } else if (!isIE && $.trim(selText) === $.trim(expandedSelRange.endContainer.innerText)) {
                                expandedSelRange.endContainer.innerHTML += "<span class='dummy'>&nbsp;</span>";
                                position = $(".dummy").offset();
                                $(".dummy").remove();
                            } else {
                                expandedSelRange.insertNode(dummy);
                                position = $(dummy).offset();
                                dummy.parentNode.removeChild(dummy);
                            }
                        }
                    } else if (document.selection && document.selection.createRange) {
                        range = document.selection.createRange();
                        expandedSelRange = range.duplicate();

                        selText = expandedSelRange.text;
                        if ($.trim(selText) === '' || selText.split(' ').length < settings.minWords) return;

                        range.collapse(false);
                        range.pasteHTML(html);

                        expandedSelRange.setEndPoint("EndToEnd", range);
                        expandedSelRange.select();
                        position = $(".dummy").offset();
                        $(".dummy").remove();
                    }

                    if (position.top === 0 && position.left === 0) return;

                    originalElement.html(startText + span + endText);
                    parentCommentContainer = $(expandedSelRange.commonAncestorContainer.offsetParent).closest('.commentable-section');
                    $(settings.selector).css("top", position.top + topOffset + "px");
                    $(settings.selector).css("left", position.left + leftOffset + "px");

                    // These parameters can be whatever you'd like
                    settings.complete(originalElement, origHtml, selText, parentCommentContainer);
                    $(settings.selector).show();

                }
                $(settings.selector).hide();
                $(settings.selector).css("position", "absolute");
                $(document).bind('mouseup.highlighter', function (e) {
                    if (isDown) {
                        numClicks = 1;
                        clicks = 0;
                        setTimeout(function () {
                            insertSpanAfterSelection(1);
                        }, 300);
                        isDown = false;
                    }
                });
                $(this).bind('mouseup.highlighter', function (e) {
                    numClicks = 1;
                    clicks = 0;
                    setTimeout(function () {
                        insertSpanAfterSelection(1);
                    }, 300);
                });
                $(this).bind('dblclick.highlighter', function (e) {
                    numClicks = 2;
                    setTimeout(function () {
                        insertSpanAfterSelection(2);
                    }, 300);
                });
                $(this).bind('mousedown.highlighter', function (e) {
                    $(settings.selector).hide();
                    isDown = true;
                });

            });
        },
        destroy: function (content) {
            return this.each(function () {
                $(document).unbind('mouseup.highlighter');
                $(this).unbind('mouseup.highlighter');
                $(this).unbind('dblclick.highlighter');
                $(this).unbind('mousedown.highlighter');
            });
        }
    };

    /*
     * Method calling logic taken from the
     * jQuery article on best practices for
     * plugins.
     *
     * http://docs.jquery.com/Plugins/Authoring
     */
    $.fn.highlighter = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.highlighter');
        }

    };

})(jQuery);