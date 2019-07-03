/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/controls/close',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    hider,
    previewerFactory,
    pluginFactory,
    itemData
) {
    'use strict';

    const runnerConfig = {
        serviceCallId : 'foo',
        providers : {
            runner: {
                id: 'qtiItemPreviewer',
                module: 'taoQtiTestPreviewer/previewer/provider/item/item',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'runner'
            },
            proxy: {
                id: 'qtiItemPreviewProxy',
                module: 'taoQtiTestPreviewer/previewer/proxy/item',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'proxy'
            },
            communicator: {
                id: 'request',
                module: 'core/communicator/request',
                bundle: 'loader/vendor.min',
                category: 'communicator'
            },
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        },
        options : {}
    };

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Mock the queries
    $.mockjax({
        url: '/init*',
        responseText: {
            success: true
        }
    });
    $.mockjax({
        url: '/getItem*',
        responseText: {
            success: true,
            content: {
                type: 'qti',
                data: itemData
            },
            baseUrl: '',
            state: {}
        }
    });

    QUnit.module('API');

    QUnit.test('module', assert => {
        const ready = assert.async();
        assert.expect(3);
        previewerFactory('#fixture-api', runnerConfig)
            .on('ready', function (runner) {
                assert.equal(typeof pluginFactory, 'function', 'The module exposes a function');
                assert.equal(typeof pluginFactory(runner), 'object', 'The factory produces an instance');
                assert.notStrictEqual(pluginFactory(runner), pluginFactory(runner), 'The factory provides a different instance on each call');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'render'},
        {title: 'finish'},
        {title: 'destroy'},
        {title: 'trigger'},
        {title: 'getTestRunner'},
        {title: 'getAreaBroker'},
        {title: 'getConfig'},
        {title: 'setConfig'},
        {title: 'getState'},
        {title: 'setState'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'}
    ]).test('plugin API ', (data, assert) => {
        const ready = assert.async();
        assert.expect(1);

        previewerFactory('#fixture-api', runnerConfig)
            .on('ready', function (runner) {
                const plugin = pluginFactory(runner);
                assert.equal(typeof plugin[data.title], 'function', `The instances expose a ${data.title} function`);
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.module('UI');

    QUnit.test('render / destroy', assert => {
        const ready = assert.async();
        assert.expect(3);

        previewerFactory('#fixture-render', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('enable / disable', assert => {
        const ready = assert.async();
        assert.expect(7);

        previewerFactory('#fixture-enable', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('disablenav', resolve)
                                .trigger('disablenav');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('enablenav', resolve)
                                .trigger('enablenav');
                        });
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return plugin.disable();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('show / hide', assert => {
        const ready = assert.async();
        assert.expect(4);

        previewerFactory('#fixture-show', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        return plugin.hide();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.ok(hider.isHidden($button), 'The button has been hidden');
                        return plugin.show();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        return plugin.destroy();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('behavior');

    QUnit.test('close', assert => {
        const ready = assert.async();
        assert.expect(4);

        previewerFactory('#fixture-close', runnerConfig)
            .on('ready', function (runner) {
                const areaBroker = runner.getAreaBroker();
                const plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        const $container = areaBroker.getArea('context');
                        const $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        runner.on('finish', function() {
                            assert.ok(true, 'The close action finish the test');
                        });
                        $button.click();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Error in init method: ${err.message}`);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        const ready = assert.async();
        const $container = $('#visual-test');
        const itemRef = 'item-1';
        assert.expect(1);

        previewerFactory($container, runnerConfig)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner
                    .after('renderitem.runnerComponent', function() {
                        assert.ok(true, 'The previewer has been rendered');
                        ready();
                    })
                    .loadItem(itemRef);
            });
    });

});
