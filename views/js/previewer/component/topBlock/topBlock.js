define([
    'jquery',
    'lodash',
    'ui/component',
    'tpl!taoQtiTestPreviewer/previewer/component/topBlock/tpl/topBlock',
    'tpl!taoQtiTestPreviewer/previewer/component/topBlock/tpl/topBlockData',
    'css!taoQtiTestPreviewer/previewer/component/topBlock/css/topBlock',
], function ($, _, componentFactory, topBlockTpl, topBlockDataTpl) {
    'use strict';

    /**
     * Builds a topBlock component
     *
     * @param {JQuery} container
     * @param {Object} config
     * @param {String} config.title - the test title
     * @param {Function} config.onClose - the callback function
     * @returns {component}
     * @fires ready - When the component is ready to work
     */
    function topBlockFactory(container, config) {
        const topBlock = componentFactory()
            .setTemplate(topBlockTpl)
            .on('init', function(){
                this.render(container);
            })
            .on('render', function () {
                const $info = $(topBlockDataTpl({
                    title: config.title
                }));
                const $element = this.getElement();
                $element.find('.top-block-preview-info').append($info);
                $element.find('.close').on('click', config.onClose);
                const $icon = $element.find('.top-block-preview-collapser .icon');
                $element.find('.top-block-preview-collapser').on('click', () => {
                    $icon.toggleClass('icon-up');
                    $icon.toggleClass('icon-down');
                    $element.toggleClass('open');
                    $element.toggleClass('close');
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
