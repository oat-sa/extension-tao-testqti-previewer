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
    'core/promise',
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/controls/close',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    Promise,
    hider,
    previewerFactory,
    pluginFactory,
    itemData
) {
    'use strict';

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

    QUnit.test('module', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }]
        };
        assert.expect(3);
        previewerFactory(config, $('#fixture-api'))
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
    ]).test('plugin API ', function (data, assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }]
        };
        assert.expect(1);
        previewerFactory(config, $('#fixture-api'))
            .on('ready', function (runner) {
                var plugin = pluginFactory(runner);
                assert.equal(typeof plugin[data.title], 'function', 'The instances expose a "' + data.title + '" function');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.module('UI');

    QUnit.test('render / destroy', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        };
        assert.expect(3);
        previewerFactory(config, $('#fixture-render'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('enable / disable', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        };
        assert.expect(7);
        previewerFactory(config, $('#fixture-enable'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('disablenav', resolve)
                                .trigger('disablenav');
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('enablenav', resolve)
                                .trigger('enablenav');
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return plugin.disable();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('show / hide', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        };
        assert.expect(4);
        previewerFactory(config, $('#fixture-show'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        return plugin.hide();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.ok(hider.isHidden($button), 'The button has been hidden');
                        return plugin.show();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('behavior');

    QUnit.test('close', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        };
        assert.expect(4);
        previewerFactory(config, $('#fixture-close'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('close');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        var $container = areaBroker.getArea('context');
                        var $button = $container.find('[data-control="close"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        runner.on('finish', function() {
                            assert.ok(true, 'The close action finish the test');
                        });
                        $button.click();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var serviceCallId = 'previewer';
        var itemRef = 'item-1';
        var config = {
            serviceCallId: serviceCallId,
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            }]
        };

        assert.expect(1);

        previewerFactory(config, $container)
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
