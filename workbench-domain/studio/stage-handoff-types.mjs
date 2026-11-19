export function finalPrompt(d) {
    const supplement = d.supplement, storyboard = d.storyboardSupplement;
    if (!storyboard?.enabled || !storyboard.text.trim())
        return supplement?.enabled && supplement.text.trim() ? [d.prompt, '摄影棚补充：\n' + supplement.text].filter(s => s.trim()).join('\n\n') : d.prompt;
    return [d.prompt, '分镜补充：\n' + storyboard.text, supplement?.enabled && supplement.text.trim() ? '摄影棚补充：\n' + supplement.text : ''].filter(s => s.trim()).join('\n\n');
}
