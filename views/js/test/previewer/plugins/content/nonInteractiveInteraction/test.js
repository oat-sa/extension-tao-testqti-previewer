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
 * @author Anshul Sharma <ansul@taotesting.com>
 */
define([
    'jquery',
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/content/nonInteractiveInteraction',
    'json!taoQtiItem/test/samples/json/formated-card.json',
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
                module: 'taoQtiTestPreviewer/previewer/plugins/content/nonInteractiveInteraction',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'content'
            }]
        },
        options : {
            readOnly: true,
            hideActionBars: true
        }
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
            state: {
                RESPONSE: {
                    response : {
                        base: {
                            string : `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar lorem in ornare aliquet. 
                                Etiam ac molestie velit. Suspendisse potenti. Donec dapibus, sem nec placerat auctor, 
                                tortor sapien porta erat, vel dignissim urna justo ac libero. Integer ullamcorper purus dui, 
                                ac placerat ligula blandit id. Vivamus laoreet sodales sodales. Cras ac arcu tristique, 
                                sagittis urna nec, scelerisque orci. Fusce quam dolor, accumsan vitae urna et, imperdiet eleifend dui. 
                                Integer pretium mi ac urna ultricies sodales. Aliquam erat volutpat. Aliquam erat volutpat. 
                                Vestibulum est est, porttitor ut lectus quis, commodo accumsan nulla. Aliquam placerat turpis tellus, 
                                id accumsan lacus tincidunt a. Aliquam vehicula, orci eu tincidunt faucibus, leo dui fermentum dolor, 
                                sed maximus metus metus in enim. Donec condimentum elit posuere rutrum tincidunt. 
                                Donec condimentum turpis id dolor mattis sagittis. Ut vestibulum mollis mollis. Donec nisi felis, 
                                pellentesque quis libero eu, sollicitudin venenatis mauris. Morbi gravida varius eros, 
                                non fringilla mi imperdiet in. Sed egestas tristique molestie. Sed eget mi hendrerit, maximus libero a, 
                                venenatis mi. Donec iaculis massa et purus euismod, eu porta ligula rhoncus. Phasellus in dolor placerat, 
                                molestie lorem vel, venenatis mi. Nullam varius, felis sed pulvinar congue, enim turpis tincidunt diam, 
                                non congue nulla ante ut urna. Mauris purus magna, semper vitae sollicitudin eu, ultricies in orci. 
                                Vivamus eget viverra velit. Etiam gravida leo iaculis, tempor est et, rhoncus eros. 
                                Phasellus ut ullamcorper magna. Etiam porta, metus nec faucibus pellentesque, enim magna mattis augue, 
                                in rhoncus turpis urna a erat.`
                        }
                    }
                }
            }
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
        {title: 'setState'}
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

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        const ready = assert.async();
        const $container = $('#visual-test');
        const itemRef = 'item-1';
        assert.expect(2);

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
                    .loadItem(itemRef)
                    .after('renderitem.runnerComponent', function() {
                        const ckeEditorsContent = runner.getAreaBroker().getContentArea().find('.qti-extendedTextInteraction div.cke_contents');
                        const $ckeEditorContent = $(ckeEditorsContent[0]);
                        const ckeEditorIFrame = $ckeEditorContent.find('iframe.cke_wysiwyg_frame');
                        const ckeEditorBody = ckeEditorIFrame[0].contentWindow.document.querySelector('body');
                        $ckeEditorContent[0].style.height = `${ckeEditorBody.scrollHeight + 20}px`;

                        assert.ok(true, 'The previewer has been rendered');
                        assert.equal($ckeEditorContent[0].style.height, `${ckeEditorBody.scrollHeight + 20}px`,'Interactions height is updated to show hidden content by the plugin');

                        ready();
                    });

            });

    });

});
