// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// https://codemadesimple.wordpress.com/2012/11/15/debug-chrome-dev-tools-panel/

chrome.devtools.panels.create(
    'Preprocessor',
    'herbie.png', // No icon path
    'Panel/PreprocessorPanel.html',
    null // no callback needed
);
