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
                this.getElement().find('.top-block-preview-info').append($info);
                this.getElement().find('.close').on('click', config.onClose);
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