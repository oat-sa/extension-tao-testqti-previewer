define([
    'jquery',
    'lodash',
    'ui/component',
    'ui/hider',
    'tpl!taoQtiTestPreviewer/previewer/component/topBlock/tpl/topBlock',
    'tpl!taoQtiTestPreviewer/previewer/component/topBlock/tpl/topBlockData',
    'css!taoQtiTestPreviewer/previewer/component/topBlock/css/topBlock',
], function ($, _, componentFactory, hider, topBlockTpl, topBlockDataTpl) {
    'use strict';

    /**
     * Builds a component
     *
     * @param {Object} config
     * @returns {component}
     * @fires ready - When the component is ready to work
     */
    function topBlockFactory(config) {
        const topBlock = componentFactory()
            .setTemplate(topBlockTpl)
            .on('render', function () {
                const $info = $(topBlockDataTpl({
                    title: config.title
                }));
                const $element = this.getElement();
                $element.find('.top-block-preview-info').append($info);
                $element.find('.close').on('click', config.onClose);
                const $icon = $element.find('.top-block-preview-collapser .icon');
                const $main = $element.find('.top-block-preview-main');
                $element.find('.top-block-preview-collapser').on('click', () => {
                    if ($icon.hasClass('icon-up')) {
                        $icon.removeClass('icon-up');
                        $icon.addClass('icon-down');
                    } else {
                        $icon.removeClass('icon-down');
                        $icon.addClass('icon-up');
                    }
                    hider.toggle($main);
                });
                /**
                 * @event ready
                 */
                this.trigger('ready');
            });

        // initialize the component with the provided config
        // defer the call to allow to listen to the init event
        _.defer(function() {
            topBlock.init(config);
        });

        return topBlock;
    }

    return topBlockFactory;
});