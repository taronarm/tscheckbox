/**
 * tsCheckbox jQuery plugin
 *
 * * * Usage example:
 * $('input[type="checkbox"]').tsCheckbox(params);
 *
 * * * Acceptable parameters:
 * params = {
 *     // add checkboxes html attributes to created items
 *     inheritClass: [true / false],
 *     inheritId: [true / false],
 *     inheritName: [true / false],
 *
 *     boxPosition: ['afterLastItem' / 'beforeFirstName'] / object: {method: ['appendTo' / 'insertBefore' / ...], selector: [jQuery selector / jQuery object]},
 *     hideSource: [true / false],
 *     boxClass: string,
 *     verticalClass: [true / false / string],
 *     boxTag: string,
 *     itemContent: [true / false / string],
 *     itemsClass: string,
 *     checkedClass: string,
 *     tmpCheckedClass: string,
 *     tmpUncheckedClass: string,
 *     disabledClass: string,
 *     nextCheckedClass: string,
 *     prevCheckedClass: string,
 *
 *     eventCallbacks: {event [click / sourceClick / change / ...]: function}
 * }
 *
 */
(function($) {
    $.fn.tsCheckbox = function(params) {
        var defaults = {
            inheritClass: true,
            inheritId: false,
            inheritName: false,

            boxPosition: 'afterLastItem',
            hideSource: true,
            boxClass: 'tsCheckBox',
            verticalClass: false,
            boxTag: 'div',
            itemContent: true,
            itemsClass: 'tsItem',
            checkedClass: 'tsChecked',
            tmpCheckedClass: 'tsTmpChecked',
            tmpUncheckedClass: 'tsTmpUnchecked',
            disabledClass: 'tsDisabled',
            nextCheckedClass: 'tsNextChecked',
            prevCheckedClass: 'tsPrevChecked',

            eventCallbacks: {}
        };
        var labels = {},
            mouse = {
                start: {x: null, y: null},
                end: {x: null, y: null},
                current: {x: null, y: null}
            };

        var init = function($sourceItems) {
                setLabels();
                $sourceItems = $sourceItems || $();
                params = $.extend({}, defaults, params);
                if ($sourceItems.length !== 0) {
                    params.$sourceItems = $sourceItems;
                    generateTemplate();
                }
                handleMouseEvents();
            },
            isItemInArea = function($item, mousePos) {
                mousePos = mousePos || mouse.current;
                var itemPos = $item[0].getBoundingClientRect();

                if (mousePos.x > mouse.start.x) {
                    var mouseLeft  = mouse.start.x;
                    var mouseRight = mousePos.x;
                } else {
                    var mouseLeft  = mousePos.x;
                    var mouseRight = mouse.start.x;
                }
                if (mousePos.y > mouse.start.y) {
                    var mouseTop    = mouse.start.y;
                    var mouseBottom = mousePos.y;
                } else {
                    var mouseTop    = mousePos.y;
                    var mouseBottom = mouse.start.y;
                }

                if (mouseLeft > itemPos.left && mouseRight < itemPos.right && mouseTop > itemPos.top && mouseBottom < itemPos.bottom) {
                    return false;
                } else if (
                    ((mouseLeft <= itemPos.left && mouseRight >= itemPos.left) || (mouseLeft <= itemPos.right && mouseRight >= itemPos.right) || (mouseLeft >= itemPos.left && mouseRight <= itemPos.right))
                    &&
                    ((mouseTop <= itemPos.top && mouseBottom >= itemPos.top) || (mouseTop <= itemPos.bottom && mouseBottom >= itemPos.bottom) || (mouseTop >= itemPos.top && mouseBottom <= itemPos.bottom))
                ) {
                    return true;
                } else {
                    return false;
                }
            },
            handleMouseEvents = function() {
                $(document).on('mousedown', function(event) {
                    event = event || window.event;
                    mouse.start = getMousePosition(event);
                });
                $('body').on('mousemove', function(event) {
                    if (mouse.start.x !== null) {
                        event = event || window.event;
                        mouse.current = getMousePosition(event);
                        onMouseMove();
                    }
                });
                $(document).on('mouseup', function(event) {
                    if (mouse.start.x !== null) {
                        event = event || window.event;
                        mouse.end = getMousePosition(event);
                        onMouseUp();
                    }
                })
            },
            onMouseMove = function() {
                for (var key in params.$items) {
                    if (!params.$items[key].data('sourceItem').disabled) {
                        if (isItemInArea(params.$items[key])) {
                            if (params.$items[key].data('sourceItem').checked === true) {
                                params.$items[key].data('tmpChecked', false).data('tmpUnchecked', true);
                            } else {
                                params.$items[key].data('tmpUnchecked', false).data('tmpChecked', true);
                            }
                        } else {
                            params.$items[key].data('tmpUnchecked', false).data('tmpChecked', false);
                        }
                    }
                }
                initStyleClasses();
            },
            onMouseUp = function() {
                for (var key in params.$items) {
                    if (!params.$items[key].data('sourceItem').disabled && isItemInArea(params.$items[key], mouse.end)) {
                        toggleCheckStatus(params.$items[key], true);
                    }
                    params.$items[key].data('tmpUnchecked', false).data('tmpChecked', false);
                }
                if (mouse.start.x !== mouse.end.x && mouse.start.y !== mouse.end.y) {
                    initStyleClasses();
                }
                mouse.start = {x: null, y: null};
            },
            getMousePosition = function(event) {
                return {
                    x: event.clientX,
                    y: event.clientY
                }
            },
            setLabels = function() {
                var l = document.getElementsByTagName('label');
                for (var i = 0; i < l.length; i++) {
                    if (l[i].htmlFor) {
                        labels[l[i].htmlFor] = l[i];
                    }
                }
            },
            bindEvent = function($item, event) {
                if (event.indexOf('source') === 0) {
                    var pureEvent = event.slice(6).charAt(0).toLowerCase() + event.slice(7);
                    var $target   = $($item.data('sourceItem'));
                } else {
                    var pureEvent = event;
                    var $target   = $item;
                }
                $target.off(pureEvent).on(pureEvent, function(e) {
                    switch (event) {
                        case 'click':
                            toggleCheckStatus($item);
                            break;
                        case 'sourceChange':
                            $item.trigger('change');
                            initStyleClasses();
                            break;
                    }
                    if (typeof params.eventCallbacks[event]  === 'function') {
                        params.eventCallbacks[event]($item, e, params);
                    }
                })
            },
            generateTemplate = function() {
                var boxClass = params.boxClass;
                if (params.verticalClass === true) {
                    boxClass += ' tsVertical';
                } else if (typeof params.verticalClass === 'string') {
                    boxClass += ' ' + params.verticalClass;
                } else {
                    boxClass += ' tsHorizontal';
                }
                params.$box = jQuery('<' + params.boxTag + '/>', {
                    'class': boxClass
                });
                if (params.boxPosition === 'afterLastItem') {
                    params.boxPosition = {
                        method: 'insertAfter',
                        selector: params.$sourceItems.last()
                    };
                } else if (params.boxPosition === 'beforeFirstItem') {
                    params.boxPosition = {
                        method: 'insertBefore',
                        selector: params.$sourceItems.first()
                    };
                }

                if (typeof params.boxPosition === 'object' && (params.boxPosition.method in params.$box) && params.boxPosition.selector) {
                    if (typeof params.boxPosition.selector === 'string') {
                        params.boxPosition.selector = $(params.boxPosition.selector).first();
                    }
                    params.$box[params.boxPosition.method](params.boxPosition.selector);

                    params.$items = [];
                    params.$sourceItems.each(function(key, sourceItem) {
                        var $sourceItem = $(sourceItem);
                        var itemClass = $sourceItem.is(':checked') ? params.itemsClass + ' ' + params.checkedClass : params.itemsClass;
                        if (sourceItem.disabled === true) {
                            itemClass += ' ' + params.disabledClass;
                        }
                        params.$items[key] = jQuery('<span/>', {
                            'class': params.inheritClass && sourceItem.className ? sourceItem.className + ' ' + itemClass : itemClass,
                            'id': params.inheritId  && sourceItem.id ? sourceItem.id : null,
                            'name': params.inheritName ? sourceItem.getAttribute('name') : null,
                            'text': getItemContent($sourceItem)
                        }).data('sourceItem', sourceItem).appendTo(params.$box);
                        if (params.hideSource) {
                            sourceItem.style.display = 'none';
                        }
                        bindEvent(params.$items[key], 'click');
                        bindEvent(params.$items[key], 'sourceChange');
                        bindEvent(params.$items[key], 'init');
                        params.$items[key].trigger('init');
                        for (var event in params.eventCallbacks) {
                            bindEvent(params.$items[key], event);
                        }
                    });
                    initStyleClasses();
                }
            },
            getItemContent = function($sourceItem) {
                if (params.itemContent === true) {
                    if (typeof labels[$sourceItem[0].id] !== 'undefined') {
                        if (params.hideSource) {
                            labels[$sourceItem[0].id].style.display = 'none';
                        }
                        return labels[$sourceItem[0].id].innerText || labels[$sourceItem[0].id].textContent;
                    } else {
                        var $label = $sourceItem.closest('label');
                        if ($label.length === 1) {
                            if (params.hideSource) {
                                $label[0].style.display = 'none';
                            }
                            return $label.text();
                        }
                    }
                } else if (typeof params.itemContent === 'string') {
                    return $sourceItem.data(params.itemContent);
                }
                return $sourceItem.val();
            },
            initStyleClasses = function() {
                for (var key in params.$items) {
                    var $item = params.$items[key];
                    var $next = $item.next();
                    var $prev = $item.prev();
                    if ($item.data('sourceItem').disabled === true) {
                        $item.addClass(params.disabledClass);
                    } else {
                        $item.removeClass(params.disabledClass);
                    }
                    if (isNowChecked($item)) {
                        if ($next.hasClass(params.itemsClass)) {
                            if (isNowChecked($next)) {
                                $item.addClass(params.nextCheckedClass);
                                $next.addClass(params.prevCheckedClass);
                            } else {
                                $item.removeClass(params.nextCheckedClass);
                                $next.removeClass(params.prevCheckedClass);
                            }
                        }
                        if ($prev.hasClass(params.itemsClass)) {
                            if (isNowChecked($prev)) {
                                $item.addClass(params.prevCheckedClass);
                                $prev.addClass(params.nextCheckedClass);
                            } else {
                                $item.removeClass(params.prevCheckedClass);
                                $prev.removeClass(params.nextCheckedClass);
                            }
                        }
                    } else {
                        if ($next.hasClass(params.itemsClass)) {
                            $next.removeClass(params.prevCheckedClass);
                        }
                        if ($prev.hasClass(params.itemsClass)) {
                            $prev.removeClass(params.nextCheckedClass);
                        }
                        $item.removeClass(params.prevCheckedClass + ' ' + params.nextCheckedClass);
                    }

                    if ($item.data('sourceItem').checked === true) {
                        $item.addClass(params.checkedClass);
                    } else {
                        $item.removeClass(params.checkedClass);
                    }

                    if ($item.data('tmpChecked') === true) {
                        $item.addClass(params.tmpCheckedClass);
                    } else {
                        $item.removeClass(params.tmpCheckedClass);
                    }

                    if ($item.data('tmpUnchecked') === true) {
                        $item.addClass(params.tmpUncheckedClass);
                    } else {
                        $item.removeClass(params.tmpUncheckedClass);
                    }
                }
            },
            isNowChecked = function($item) {
                return (($item.data('sourceItem').checked === true && $item.data('tmpUnchecked') !== true) || $item.data('tmpChecked') === true);
            },
            toggleCheckStatus = function($item, disableStyles) {
                disableStyles = disableStyles || false;
                if (!$item.data('sourceItem').disabled) {
                    if ($item.data('sourceItem').checked === true) {
                        $item.data('sourceItem').checked = false;
                    } else {
                        $item.data('sourceItem').checked = true;
                    }
                    if (!disableStyles) {
                        initStyleClasses();
                    }
                    $item.trigger('change');
                }
            };

        return init(this);
    };
})(jQuery);